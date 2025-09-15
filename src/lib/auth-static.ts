import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/enums';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
}

// For ISR pages, we return null and handle auth on client side
// This allows the pages to be statically generated
export async function getCurrentUserStatic(): Promise<User | null> {
  // Return null for static generation - auth will be handled client-side
  return null;
}

// For ISR pages, we return null and handle auth on client side
export async function requireAdminStatic(): Promise<User | null> {
  // Return null for static generation - auth will be handled client-side
  return null;
}

// For ISR pages, we return null and handle auth on client side
export async function requireClientStatic(): Promise<User | null> {
  // Return null for static generation - auth will be handled client-side
  return null;
}
