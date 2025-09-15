import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

// GET /api/client/proposals - Get proposals for clients with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a client or client member
    const userRecord = await prisma.user.findUnique({
      where: { authId: user.id },
      include: {
        agencyMembership: true,
        clientMemberships: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to view proposals
    const canViewProposals =
      userRecord.role === "CLIENT" ||
      userRecord.role === "CLIENT_MEMBER" ||
      userRecord.role === "PLATFORM_ADMIN";


    if (!canViewProposals) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause for proposals visibility
    const where: any = {
      deletedAt: null,
    };

    // Filter by client - if user is a client, show their proposals
    if (userRecord.role === "CLIENT") {
      // For CLIENT role, first check client memberships (most reliable)
      if (userRecord.clientMemberships.length > 0) {
        const clientIds = userRecord.clientMemberships.map(
          (membership) => membership.clientId
        );
        where.clientId = { in: clientIds };
      } else {
        // Fallback: search for client record by name
        const clientRecord = await prisma.client.findFirst({
          where: {
            OR: [{ name: { contains: userRecord.name, mode: "insensitive" } }],
          },
        });

        if (clientRecord) {
          where.clientId = clientRecord.id;
        } else {
          // Return empty result
          where.clientId = "no-match";
        }
      }
    } else if (
      userRecord.role === "CLIENT_MEMBER" &&
      userRecord.clientMemberships.length > 0
    ) {
      // If user is a client member, show proposals for their client
      const clientIds = userRecord.clientMemberships.map(
        (membership) => membership.clientId
      );
      where.clientId = { in: clientIds };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get proposals with related data
    const [proposals, totalCount] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // media is a JSON field, not a relation
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ]);

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching client proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
