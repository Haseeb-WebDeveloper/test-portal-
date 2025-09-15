import { prisma } from '@/lib/prisma';
import { ContractStatus, ProposalStatus } from '@/types/enums';

export interface ClientWithDetails {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  activeContractsCount: number;
  pendingProposalsCount: number;
  lastActivity: Date | null;
  lastActivityDescription: string | null;
  teamMembers: {
    id: string;
    name: string;
    avatar: string | null;
    email?: string;
    role?: string;
  }[];
  rooms?: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    lastMessageAt: Date | null;
  }[];
}

export interface ClientsQueryOptions {
  sortBy?: 'name' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  page?: number;
  limit?: number;
}

export async function getClientsWithDetails(options: ClientsQueryOptions = {}): Promise<{
  clients: ClientWithDetails[];
  totalCount: number;
  totalPages: number;
}> {
  const {
    sortBy = 'name',
    sortOrder = 'asc',
    search,
    page = 1,
    limit = 12,
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause for search
  const whereClause = {
    deletedAt: null,
    isActive: true,
    ...(search && {
      name: {
        contains: search,
        mode: 'insensitive' as const,
      },
    }),
  };

  // Get total count for pagination
  const totalCount = await prisma.client.count({
    where: whereClause,
  });

  // Build order by clause
  const orderBy: any = {};
  if (sortBy === 'name') {
    orderBy.name = sortOrder;
  } else if (sortBy === 'lastActivity') {
    orderBy.updatedAt = sortOrder;
  }

  // Fetch clients with related data
  const clients = await prisma.client.findMany({
    where: whereClause,
    orderBy,
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
            },
          },
        },
        take: 8, // Limit to 8 team members for display
      },
    },
  });

  // Transform the data to match our interface
  const clientsWithDetails: ClientWithDetails[] = clients.map((client) => {
    // Use client's updatedAt as last activity
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

    return {
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
      })),
    };
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    clients: clientsWithDetails,
    totalCount,
    totalPages,
  };
}

export async function getClientById(id: string): Promise<ClientWithDetails | null> {
  const result = await getClientsWithDetails({ limit: 1 });
  return result.clients.find(client => client.id === id) || null;
}
