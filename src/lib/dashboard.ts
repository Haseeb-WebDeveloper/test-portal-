import { prisma } from '@/lib/prisma';
import { ContractStatus, ProposalStatus } from '@/types/enums';

export interface DashboardData {
  contracts: {
    active: number;
    drafts: number;
  };
  proposals: {
    new: number;
    pending: number;
  };
  clients: {
    id: string;
    name: string;
    avatar: string | null;
    activeContracts: number;
    pendingProposals: number;
    lastActivity: string;
  }[];
  news: {
    id: string;
    title: string;
    featuredImage: string | null;
    createdAt: string;
  }[];
  unreadMessages: number;
  recentRooms: {
    id: string;
    name: string;
    lastMessage: string | null;
    unreadCount: number;
  }[];
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  console.log('🚀 Starting dashboard data fetch for user:', userId);
  
  // Execute all queries in parallel for optimal performance
  const [
    contractsGrouped,
    proposalsGrouped,
    clientsData,
    newsData,
    userRooms,
    unreadMessagesCount
  ] = await Promise.all([
    // Contracts data - get counts by status
    prisma.contract.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        status: {
          in: [ContractStatus.ACTIVE, ContractStatus.DRAFT, ContractStatus.PENDING_APPROVAL]
        }
      },
      _count: {
        status: true
      }
    }),

    // Proposals data - get counts by status
    prisma.proposal.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        status: {
          in: [ProposalStatus.DRAFT, ProposalStatus.SENT, ProposalStatus.SEEN]
        }
      },
      _count: {
        status: true
      }
    }),

    // Recent 5 clients with their activity
    prisma.client.findMany({
      where: {
        deletedAt: null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        updatedAt: true,
        contracts: {
          where: {
            deletedAt: null,
            status: ContractStatus.ACTIVE
          },
          select: { id: true }
        },
        proposals: {
          where: {
            deletedAt: null,
            status: {
              in: [ProposalStatus.DRAFT, ProposalStatus.SENT, ProposalStatus.SEEN]
            }
          },
          select: { id: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    }),

    // Recent 3 news
    prisma.news.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        featuredImage: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    }),

    // User's rooms for message calculation
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

    // Calculate unread messages count - using Prisma query instead of raw SQL for now
    prisma.message.count({
      where: {
        isDeleted: false,
        room: {
          participants: {
            some: {
              userId: userId,
              isActive: true,
              OR: [
                { lastReadAt: null },
                { lastReadAt: { lt: new Date() } } // This is a simplified version
              ]
            }
          }
        }
      }
    })
  ]);

  console.log('📊 Raw data fetched:');
  console.log('- Contracts grouped:', contractsGrouped);
  console.log('- Proposals grouped:', proposalsGrouped);
  console.log('- Clients count:', clientsData.length);
  console.log('- News count:', newsData.length);
  console.log('- User rooms count:', userRooms.length);
  console.log('- Unread messages count:', unreadMessagesCount);

  // Process contracts data
  const contractsByStatus = contractsGrouped.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  const contracts = {
    active: contractsByStatus[ContractStatus.ACTIVE] || 0,
    drafts: (contractsByStatus[ContractStatus.DRAFT] || 0) + (contractsByStatus[ContractStatus.PENDING_APPROVAL] || 0)
  };

  // Process proposals data
  const proposalsByStatus = proposalsGrouped.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  const proposals = {
    new: (proposalsByStatus[ProposalStatus.SENT] || 0) + (proposalsByStatus[ProposalStatus.SEEN] || 0),
    pending: proposalsByStatus[ProposalStatus.DRAFT] || 0
  };

  console.log('📈 Processed data:');
  console.log('- Contracts:', contracts);
  console.log('- Proposals:', proposals);

  // Process clients data
  const clients = clientsData.map(client => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - client.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    let lastActivity = 'No recent activity';
    if (diffInDays === 0) {
      lastActivity = 'Updated today';
    } else if (diffInDays === 1) {
      lastActivity = 'Updated yesterday';
    } else if (diffInDays < 7) {
      lastActivity = `${diffInDays} days ago`;
    } else {
      lastActivity = `Updated on ${client.updatedAt.toLocaleDateString()}`;
    }

    return {
      id: client.id,
      name: client.name,
      avatar: client.avatar,
      activeContracts: client.contracts.length,
      pendingProposals: client.proposals.length,
      lastActivity
    };
  });

  // Process news data
  const news = newsData.map(item => ({
    id: item.id,
    title: item.title,
    featuredImage: item.featuredImage,
    createdAt: item.createdAt.toISOString()
  }));

  // Process rooms and unread messages
  const recentRooms = await Promise.all(
    userRooms.map(async (participant) => {
      const room = participant.room;
      const lastMessage = room.messages[0];
      
      // Calculate actual unread count for this room
      const unreadCount = await getRoomUnreadCount(userId, room.id);
      
      console.log(`🏠 Room ${room.name}: unreadCount = ${unreadCount}, lastMessage = ${lastMessage ? 'exists' : 'none'}`);

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

  console.log('📨 Rooms with unread messages:', roomsWithUnread);

  const unreadMessages = unreadMessagesCount || 0;

  console.log('🎯 Final dashboard data:');
  console.log('- Clients:', clients.length, 'items');
  console.log('- News:', news.length, 'items');
  console.log('- Unread messages:', unreadMessages);
  console.log('- Recent rooms with unread:', roomsWithUnread.length, 'items');

  const result = {
    contracts,
    proposals,
    clients,
    news,
    unreadMessages,
    recentRooms: roomsWithUnread
  };

  console.log('✅ Dashboard data fetch completed successfully');
  return result;
}

// Helper function to get user's unread messages count for a specific room
export async function getRoomUnreadCount(userId: string, roomId: string): Promise<number> {
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
