import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/enums';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
      isActive: true,
    };

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 50, // Limit results
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role = UserRole.CLIENT_MEMBER } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create user in Supabase Auth first
    const supabaseAdmin = await createAdminClient();
    
    const { data: authData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          role: role,
        },
      });

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
          error: errorMessage,
          details: authCreateError?.message || "Unknown auth error",
        },
        { status: statusCode }
      );
    }

    // Create new user in database with real authId
    const newUser = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email,
        name,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific database errors
    let errorMessage = "Failed to create user";
    let statusCode = 500;
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // Handle Prisma unique constraint violations
      if (errorMsg.includes('unique constraint') || errorMsg.includes('duplicate key')) {
        if (errorMsg.includes('email')) {
          errorMessage = "A user with this email address already exists";
          statusCode = 409; // Conflict
        } else {
          errorMessage = "A user with this information already exists";
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
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}