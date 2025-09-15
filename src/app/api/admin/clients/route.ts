import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get clients with pagination
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.client.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const body = await request.json();
    const { name, description, website, avatar, email, members } =
      body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate members if provided
    if (members && Array.isArray(members)) {
      for (const member of members) {
        if (!member.firstName || !member.lastName || !member.email) {
          return NextResponse.json(
            { message: "All member fields are required" },
            { status: 400 }
          );
        }
        
        if (!emailRegex.test(member.email)) {
          return NextResponse.json(
            { message: "Invalid member email format" },
            { status: 400 }
          );
        }
      }
    }

    // Create user in Supabase Auth first using admin client
    const supabaseAdmin = await createAdminClient();

    console.log("Creating user in Supabase Auth for:", {
      email,
    });

    const { data: authData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          role: "CLIENT",
        },
      });

    console.log("Supabase Auth response:", { authData, authCreateError });

    if (authCreateError || !authData.user) {
      console.error("Failed to create user in Supabase Auth:", authCreateError);

      // Parse specific Supabase auth errors for better user experience
      let errorMessage = "Failed to create user in authentication system";
      let statusCode = 500;

      if (authCreateError) {
        const errorMsg = authCreateError.message.toLowerCase();
        
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('already exists') ||
            errorMsg.includes('user already registered')) {
          errorMessage = "A user with this email address already exists";
          statusCode = 409; // Conflict
        } else if (errorMsg.includes('invalid email')) {
          errorMessage = "Invalid email address format";
          statusCode = 400; // Bad Request
        } else if (errorMsg.includes('rate limit')) {
          errorMessage = "Too many requests. Please try again later";
          statusCode = 429; // Too Many Requests
        } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
          errorMessage = "Network error. Please check your connection";
          statusCode = 503; // Service Unavailable
        }
      }

      return NextResponse.json(
        {
          message: errorMessage,
          details: authCreateError?.message || "Unknown auth error",
        },
        { status: statusCode }
      );
    }

    // Create client, user, membership, and room in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create client
      const client = await tx.client.create({
        data: {
          name,
          description: description || "",
          website: website || null,
          avatar: avatar || null,
        },
      });

      // Create primary contact user with real authId
      const user = await tx.user.create({
        data: {
          authId: authData.user.id,
          email,
          name,
          role: 'CLIENT',
          isActive: true,
        },
      });

      // Create client membership for primary contact
      await tx.clientMembership.create({
        data: {
          userId: user.id,
          clientId: client.id,
          role: 'PRIMARY_CONTACT',
        },
      });

      // Create a room for the client
      const room = await tx.room.create({
        data: {
          name: `${name} - General Discussion`,
          description: `General communication room for ${name}`,
          type: 'CLIENT_SPECIFIC',
          clientId: client.id,
          isActive: true,
          createdBy: user.id, // The client user who was just created
        },
      });

      // Get all platform admins
      const platformAdmins = await tx.user.findMany({
        where: {
          role: 'PLATFORM_ADMIN',
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      // Add the client user to the room with WRITE permission
      await tx.roomParticipant.create({
        data: {
          roomId: room.id,
          userId: user.id,
          permission: 'WRITE',
          isActive: true,
          createdBy: user.id,
        },
      });

      // Add all platform admins to the room with ADMIN permission
      if (platformAdmins.length > 0) {
        await tx.roomParticipant.createMany({
          data: platformAdmins.map(admin => ({
            roomId: room.id,
            userId: admin.id,
            permission: 'ADMIN',
            isActive: true,
            createdBy: user.id,
          })),
        });
      }

      // Process additional client members if provided
      if (members && Array.isArray(members) && members.length > 0) {
        for (const member of members) {
          // Create user in Supabase Auth for the member
          const { data: memberAuthData, error: memberAuthError } =
            await supabaseAdmin.auth.admin.createUser({
              email: member.email,
              email_confirm: true, // Auto-confirm the email
              user_metadata: {
                role: "CLIENT_MEMBER",
              },
            });

          if (memberAuthError || !memberAuthData.user) {
            console.error("Failed to create member in Supabase Auth:", memberAuthError);
            // Continue with other members even if one fails
            continue;
          }

          // Create user in database with real authId
          const memberUser = await tx.user.create({
            data: {
              authId: memberAuthData.user.id,
              email: member.email,
              name: `${member.firstName} ${member.lastName}`,
              role: UserRole.CLIENT_MEMBER,
              isActive: true,
            },
          });

          // Create client membership for the member
          await tx.clientMembership.create({
            data: {
              userId: memberUser.id,
              clientId: client.id,
              role: member.role || 'member',
            },
          });

          // Add the member to the client room with WRITE permission
          await tx.roomParticipant.create({
            data: {
              roomId: room.id,
              userId: memberUser.id,
              permission: 'WRITE',
              isActive: true,
              createdBy: user.id,
            },
          });
        }
      }

      return { client, user, room };
    });

    return NextResponse.json(
      {
        message: "Client created successfully",
        client: result.client,
        room: {
          id: result.room.id,
          name: result.room.name,
          type: result.room.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    
    // Handle specific database errors
    let errorMessage = "Failed to create client";
    let statusCode = 500;
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // Handle Prisma unique constraint violations
      if (errorMsg.includes('unique constraint') || errorMsg.includes('duplicate key')) {
        if (errorMsg.includes('email')) {
          errorMessage = "A client with this email address already exists";
          statusCode = 409; // Conflict
        } else if (errorMsg.includes('name')) {
          errorMessage = "A client with this name already exists";
          statusCode = 409; // Conflict
        } else {
          errorMessage = "A client with this information already exists";
          statusCode = 409; // Conflict
        }
      } else if (errorMsg.includes('foreign key constraint')) {
        errorMessage = "Invalid reference data. Please check your input";
        statusCode = 400; // Bad Request
      } else if (errorMsg.includes('connection') || errorMsg.includes('timeout')) {
        errorMessage = "Database connection error. Please try again";
        statusCode = 503; // Service Unavailable
      }
    }
    
    return NextResponse.json(
      { 
        message: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}