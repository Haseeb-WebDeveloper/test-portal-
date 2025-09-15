import { UserRole } from "@/types/enums";

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles?: UserRole[];
  description?: string;
}

export const adminSidebarItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard.svg",
    href: "/admin",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER],
    description: "Overview and analytics"
  },
  {
    id: "clients",
    label: "Client List",
    icon: "list.svg",
    href: "/admin/clients",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER],
    description: "Manage client accounts"
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: "contract.svg",
    href: "/admin/contracts",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER],
    description: "Contract management"
  },
  {
    id: "proposals",
    label: "Proposals",
    icon: "offer.svg",
    href: "/admin/proposal",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER],
    description: "Manage proposals"
  },
  {
    id: "news",
    label: "News",
    icon: "news.svg",
    href: "/admin/news",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER],
    description: "Platform announcements"
  },
  {
    id: "messages",
    label: "Messages",
    icon: "messages.svg",
    href: "/messages",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER, UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Communication hub"
  },
  {
    id: "profile",
    label: "Profile",
    icon: "members.svg",
    href: "/admin/profile",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER, UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Profile"
  },
];

export const clientSidebarItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard.svg",
    href: "/client",
    roles: [UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Your project overview"
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: "contract.svg",
    href: "/client/contracts",
    roles: [UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Your active contracts"
  },
  {
    id: "proposals",
    label: "Proposals",
    icon: "offer.svg",
    href: "/client/proposal",
    roles: [UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Proposal status"
  },
  {
    id: "news",
    label: "News",
    icon: "news.svg",
    href: "/client/news",
    roles: [UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Platform updates"
  },
  {
    id: "messages",
    label: "Messages",
    icon: "messages.svg",
    href: "/messages",
    roles: [UserRole.PLATFORM_ADMIN, UserRole.AGENCY_MEMBER, UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Communication hub"
  },
  {
    id: "profile",
    label: "Profile",
    icon: "members.svg",
    href: "/client/profile",
    roles: [UserRole.CLIENT, UserRole.CLIENT_MEMBER],
    description: "Profile"
  },
];

// Helper function to get navigation items based on user role
export function getNavigationItems(userRole: UserRole): NavigationItem[] {
  const isAdmin = userRole === UserRole.PLATFORM_ADMIN || userRole === UserRole.AGENCY_MEMBER;
  const items = isAdmin ? adminSidebarItems : clientSidebarItems;
  
  // Filter items based on user role if roles are specified
  return items.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );
}