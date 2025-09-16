import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContractStatus, ProposalStatus, UserRole } from '@/types/enums';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = (await params).id;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Fetch client with all related data
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        contracts: {
          where: {
            deletedAt: null,
            status: ContractStatus.ACTIVE,
          },
          select: {
            id: true,
          },
        },
        proposals: {
          where: {
            deletedAt: null,
            status: {
              in: [ProposalStatus.DRAFT, ProposalStatus.SENT],
            },
          },
          select: {
            id: true,
            updatedAt: true,
          },
        },
        memberships: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
            role: true,
          },
        },
        rooms: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            lastMessageAt: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Transform the data to match our interface
    const lastActivityDate = client.updatedAt;
    
    // Generate activity description based on updatedAt
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let lastActivityDescription = 'No recent activity';
    if (diffInDays === 0) {
      lastActivityDescription = 'Updated today';
    } else if (diffInDays === 1) {
      lastActivityDescription = 'Updated yesterday';
    } else if (diffInDays < 7) {
      lastActivityDescription = `Updated ${diffInDays} days ago`;
    } else {
      lastActivityDescription = `Updated on ${lastActivityDate.toLocaleDateString()}`;
    }

    const clientWithDetails = {
      id: client.id,
      name: client.name,
      description: client.description,
      website: client.website,
      avatar: client.avatar,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      activeContractsCount: client.contracts.length,
      pendingProposalsCount: client.proposals.length,
      lastActivity: lastActivityDate,
      lastActivityDescription,
      teamMembers: client.memberships.map((membership) => ({
        id: membership.user.id,
        name: membership.user.name,
        avatar: membership.user.avatar,
        email: membership.user.email,
        role: membership.role,
      })),
      rooms: client.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        lastMessageAt: room.lastMessageAt,
      })),
    };

    return NextResponse.json(clientWithDetails);
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = (await params).id;
    const body = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const { name, description, website, avatar, clientMembers } = body;

    // Update client basic info
    const updatedClient = await prisma.client.update({
      where: {
        id: clientId,
        deletedAt: null,
      },
      data: {
        name,
        description,
        website,
        avatar,
        updatedAt: new Date(),
      },
    });

    // Update team members if provided
    if (clientMembers && Array.isArray(clientMembers)) {
      // Get current memberships to compare
      const currentMemberships = await prisma.clientMembership.findMany({
        where: {
          clientId: clientId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          userId: true,
          role: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Create maps for easier comparison
      const currentMembersMap = new Map(
        currentMemberships.map(m => [m.userId, { id: m.id, role: m.role, email: m.user.email }])
      );
      
      const newMembersMap = new Map(
        clientMembers
          .filter(m => m.id) // Only existing members
          .map(m => [m.id, { role: m.role || 'member', email: m.email }])
      );

      // Find members to remove (in current but not in new)
      const membersToRemove = currentMemberships.filter(
        m => !newMembersMap.has(m.userId)
      );

      // Find members to add (in new but not in current)
      const membersToAdd = clientMembers.filter(
        m => m.id && !currentMembersMap.has(m.id)
      );

      // Find members to update (in both but role changed)
      const membersToUpdate = clientMembers.filter(m => {
        if (!m.id || !currentMembersMap.has(m.id)) return false;
        const current = currentMembersMap.get(m.id);
        return current && current.role !== (m.role || 'member');
      });

      // Find new users to create
      const newUsersToCreate = clientMembers.filter(
        m => !m.id && m.email && m.name
      );

      // Only proceed if there are actual changes
      if (membersToRemove.length > 0 || membersToAdd.length > 0 || membersToUpdate.length > 0 || newUsersToCreate.length > 0) {
        await prisma.$transaction(async (tx) => {
          // Remove members that are no longer in the list
          if (membersToRemove.length > 0) {
            await tx.clientMembership.updateMany({
              where: {
                id: {
                  in: membersToRemove.map(m => m.id),
                },
              },
              data: {
                deletedAt: new Date(),
                isActive: false,
              },
            });
          }

          // Update existing members whose roles changed
          for (const member of membersToUpdate) {
            await tx.clientMembership.update({
              where: {
                id: currentMembersMap.get(member.id)!.id,
              },
              data: {
                role: member.role || 'member',
                updatedAt: new Date(),
              },
            });
          }

          // Add existing members that weren't previously associated
          for (const member of membersToAdd) {
            await tx.clientMembership.create({
              data: {
                clientId: clientId,
                userId: member.id,
                role: member.role || 'member',
                isActive: true,
              },
            });
          }

          // Create new users and add them
          for (const member of newUsersToCreate) {
            let user = await tx.user.findUnique({
              where: { email: member.email },
            });

            if (!user) {
              // Create user in Supabase Auth first
              const supabaseAdmin = await createAdminClient();
              
              const { data: authData, error: authCreateError } =
                await supabaseAdmin.auth.admin.createUser({
                  email: member.email,
                  email_confirm: true, // Auto-confirm the email
                  user_metadata: {
                    role: "CLIENT_MEMBER",
                  },
                });

              if (authCreateError || !authData.user) {
                console.error("Failed to create user in Supabase Auth:", authCreateError);
                throw new Error(`Failed to create user in authentication system: ${authCreateError?.message || 'Unknown auth error'}`);
              }

              // Create user in database with real authId
              user = await tx.user.create({
                data: {
                  authId: authData.user.id,
                  email: member.email,
                  name: member.name,
                  role: UserRole.CLIENT_MEMBER,
                  isActive: true,
                },
              });
            }

            await tx.clientMembership.create({
              data: {
                clientId: clientId,
                userId: user.id,
                role: member.role || 'member',
                isActive: true,
              },
            });
          }
        });
      }
    }

    // Fetch updated client with all related data
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        contracts: {
          where: {
            deletedAt: null,
            status: ContractStatus.ACTIVE,
          },
          select: {
            id: true,
          },
        },
        proposals: {
          where: {
            deletedAt: null,
            status: {
              in: [ProposalStatus.DRAFT, ProposalStatus.SENT],
            },
          },
          select: {
            id: true,
            updatedAt: true,
          },
        },
        memberships: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
            role: true,
          },
        },
        rooms: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            lastMessageAt: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Transform the data to match our interface
    const lastActivityDate = client.updatedAt;
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let lastActivityDescription = 'No recent activity';
    if (diffInDays === 0) {
      lastActivityDescription = 'Updated today';
    } else if (diffInDays === 1) {
      lastActivityDescription = 'Updated yesterday';
    } else if (diffInDays < 7) {
      lastActivityDescription = `Updated ${diffInDays} days ago`;
    } else {
      lastActivityDescription = `Updated on ${lastActivityDate.toLocaleDateString()}`;
    }

    const clientWithDetails = {
      id: client.id,
      name: client.name,
      description: client.description,
      website: client.website,
      avatar: client.avatar,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      activeContractsCount: client.contracts.length,
      pendingProposalsCount: client.proposals.length,
      lastActivity: lastActivityDate,
      lastActivityDescription,
      teamMembers: client.memberships.map((membership) => ({
        id: membership.user.id,
        name: membership.user.name,
        avatar: membership.user.avatar,
        email: membership.user.email,
        role: membership.role,
      })),
      rooms: client.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        lastMessageAt: room.lastMessageAt,
      })),
    };

    return NextResponse.json(clientWithDetails);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
