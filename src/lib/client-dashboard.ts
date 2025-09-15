import { prisma } from '@/lib/prisma';
import { ContractStatus, ProposalStatus } from '@/types/enums';
import type { ContractStatus as PrismaContractStatus } from '@prisma/client';

export interface ClientDashboardData {
  unreadMessages: number;
  contracts: {
    active: number;
  };
  proposals: {
    new: number;
    pending: number;
  };
  news: {
    id: string;
    title: string;
    featuredImage: string | null;
    createdAt: string;
  }[];
  ongoingContracts: {
    id: string;
    title: string;
    status: PrismaContractStatus;
    progressPercentage: number;
    completedTasks: number;
    totalTasks: number;
  }[];
  recentRooms: {
    id: string;
    name: string;
    lastMessage: string | null;
    unreadCount: number;
  }[];
}

export async function getClientDashboardData(userId: string): Promise<ClientDashboardData> {
  // Get user with their client memberships (same pattern as other client API routes)
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clientMemberships: {
        where: {
          isActive: true,
          deletedAt: null
        },
        include: {
          client: true
        }
      }
    }
  });

  if (!userRecord) {
    return {
      unreadMessages: 0,
      contracts: { active: 0 },
      proposals: { new: 0, pending: 0 },
      news: [],
      ongoingContracts: [],
      recentRooms: []
    };
  }

  const clientIds = userRecord.clientMemberships.map(membership => membership.clientId);

  // Debug: Check if there's any data in the database at all
  await Promise.all([
    prisma.contract.count({ where: { deletedAt: null } }),
    prisma.proposal.count({ where: { deletedAt: null } }),
    prisma.news.count({ where: { deletedAt: null } }),
    prisma.room.count({ where: { deletedAt: null } })
  ]);

  // For CLIENT role users, if they have no memberships, show all data
  // For CLIENT_MEMBER role users, they need explicit memberships
  if (clientIds.length === 0) {
    if (userRecord.role === 'CLIENT') {
      // We'll use empty array to show all data
    } else {
      return {
        unreadMessages: 0,
        contracts: { active: 0 },
        proposals: { new: 0, pending: 0 },
        news: [],
        ongoingContracts: [],
        recentRooms: []
      };
    }
  }

  // Execute all queries in parallel for optimal performance
  const [
    contractsGrouped,
    proposalsGrouped,
    newsData,
    ongoingContractsData,
    userRooms,
    unreadMessagesCount
  ] = await Promise.all([
    // Active contracts for user's clients (or all if no memberships)
    prisma.contract.groupBy({
      by: ['status'],
      where: {
        ...(clientIds.length > 0 ? { clientId: { in: clientIds } } : {}),
        deletedAt: null,
        status: ContractStatus.ACTIVE
      },
      _count: {
        status: true
      }
    }),

    // Proposals for user's clients (or all if no memberships)
    prisma.proposal.groupBy({
      by: ['status'],
      where: {
        ...(clientIds.length > 0 ? { clientId: { in: clientIds } } : {}),
        deletedAt: null,
        status: {
          in: [ProposalStatus.SENT, ProposalStatus.SEEN]
        }
      },
      _count: {
        status: true
      }
    }),

    // Recent 3 news - simplified for now to get all news
    prisma.news.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        featuredImage: true,
        createdAt: true,
        sendTo: true,
        sendToAll: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    }),

    // Ongoing contracts with tasks (or all if no memberships)
    prisma.contract.findMany({
      where: {
        ...(clientIds.length > 0 ? { clientId: { in: clientIds } } : {}),
        deletedAt: null,
        status: ContractStatus.ACTIVE
      },
      select: {
        id: true,
        title: true,
        status: true,
        progressPercentage: true,
        tasks: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    }),

    // User's rooms for message calculation - simplified for now
    prisma.roomParticipant.findMany({
      where: {
        userId: userId,
        isActive: true,
        room: {
          isActive: true,
          isArchived: false,
          deletedAt: null
        }
      },
      select: {
        room: {
          select: {
            id: true,
            name: true,
            lastMessageAt: true,
            clientId: true,
            messages: {
              where: {
                isDeleted: false
              },
              select: {
                id: true,
                content: true,
                createdAt: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        },
        lastReadAt: true
      }
    }),

    // Calculate unread messages count - simplified for now
    prisma.message.count({
      where: {
        isDeleted: false,
        room: {
          participants: {
            some: {
              userId: userId,
              isActive: true
            }
          }
        }
      }
    })
  ]);

  // Debug: Let's also check what contracts and proposals exist
  await Promise.all([
    prisma.contract.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, status: true, clientId: true }
    }),
    prisma.proposal.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, status: true, clientId: true }
    })
  ]);

  // Process contracts data
  const contractsByStatus = contractsGrouped.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  const contracts = {
    active: contractsByStatus[ContractStatus.ACTIVE] || 0
  };

  // Process proposals data
  const proposalsByStatus = proposalsGrouped.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  const proposals = {
    new: proposalsByStatus[ProposalStatus.SENT] || 0,
    pending: proposalsByStatus[ProposalStatus.SEEN] || 0
  };

  // Process news data
  const news = newsData.map(item => ({
    id: item.id,
    title: item.title,
    featuredImage: item.featuredImage,
    createdAt: item.createdAt.toISOString()
  }));

  // Process ongoing contracts data
  const ongoingContracts = ongoingContractsData.map(contract => {
    const completedTasks = contract.tasks.filter(task => task.status === 'COMPLETED').length;
    const totalTasks = contract.tasks.length;

    return {
      id: contract.id,
      title: contract.title,
      status: contract.status,
      progressPercentage: contract.progressPercentage,
      completedTasks,
      totalTasks
    };
  });

  // Process rooms and unread messages
  const recentRooms = await Promise.all(
    userRooms.map(async (participant) => {
      const room = participant.room;
      const lastMessage = room.messages[0];
      
      // Calculate actual unread count for this room
      const unreadCount = await getRoomUnreadCount(userId, room.id);

      return {
        id: room.id,
        name: room.name,
        lastMessage: lastMessage ? (lastMessage.content || 'Message') : 'No messages yet',
        unreadCount
      };
    })
  );

  // Filter rooms with unread messages and sort by unread count
  let roomsWithUnread = recentRooms
    .filter(room => room.unreadCount > 0)
    .sort((a, b) => b.unreadCount - a.unreadCount)
    .slice(0, 3);

  // If no rooms have unread messages, show recent rooms anyway
  if (roomsWithUnread.length === 0) {
    roomsWithUnread = recentRooms
      .sort((a, b) => b.unreadCount - a.unreadCount)
      .slice(0, 3);
  }

  const unreadMessages = unreadMessagesCount || 0;

  const result = {
    unreadMessages,
    contracts,
    proposals,
    news,
    ongoingContracts,
    recentRooms: roomsWithUnread
  };

  return result;
}

// Helper function to get user's unread messages count for a specific room
async function getRoomUnreadCount(userId: string, roomId: string): Promise<number> {
  const participant = await prisma.roomParticipant.findFirst({
    where: {
      userId: userId,
      roomId: roomId,
      isActive: true
    },
    select: {
      lastReadAt: true
    }
  });

  if (!participant) {
    return 0;
  }

  const unreadCount = await prisma.message.count({
    where: {
      roomId: roomId,
      isDeleted: false,
      createdAt: {
        gt: participant.lastReadAt || new Date(0) // If never read, count all messages
      }
    }
  });

  return unreadCount;
}
