"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DashboardData } from "@/lib/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { getGreeting } from "@/utils/greeting";
import { QuickActions } from "@/components/admin/quick-actions";
import AdminDashboardClient from "@/components/admin/admin-dashboard-client";
import DashboardMessagesCard, { MessagesCardItem } from "@/components/common/dashboard-messages-card";

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  // Adapt data shapes for child components
  const clientsForSnapshot = data.clients.map((client) => ({
    id: client.id,
    name: client.name,
    avatar: client.avatar,
    activeContracts: client.activeContracts,
    pendingContracts: client.pendingProposals,
    lastActivity: client.lastActivity,
  }));

  const messageItems: MessagesCardItem[] = (data.recentRooms || []).map((room) => ({
    id: room.id,
    title: room.name,
    subtitle: room.lastMessage ?? "",
    avatarUrl: null,
    avatarFallback: (room.name?.[0] || "?").toUpperCase(),
    href: `/messages?roomId=${room.id}`,
  }));

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="figma-h3">
            {getGreeting(
              user?.name ? user.name.split(" ").slice(0, 2).join(" ") : ""
            )}
          </h1>
          <p className="figma-paragraph">Here's your latest updates!</p>
        </div>
        <QuickActions />
      </div>

      {/* main content  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left contnet */}
        <div className="lg:col-span-2 space-y-6">
          {/* stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contracts Card */}
            <Link
              href="/admin/contracts"
              className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/contract.svg"
                  alt="Contracts"
                  width={20}
                  height={20}
                />
                <p className="figma-paragraph text-foreground">Contracts</p>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-end gap-2">
                  <span className="figma-h3 leading-[60%] text-figma-success">
                    {data.contracts.active}
                  </span>
                  <span className="text-sm text-foreground leading-[100%]">
                    Active
                  </span>
                </div>
                <div className="w-px h-8 bg-foreground/20"></div>
                <div className="flex items-end gap-2">
                  <span className="figma-h3 leading-[60%] text-orange-400">
                    {data.contracts.drafts}
                  </span>
                  <span className="text-sm text-foreground leading-[100%]">
                    Drafts
                  </span>
                </div>
              </div>
            </Link>

            {/* Offers Card */}
            <Link
              href="/admin/offers"
              className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/list.svg"
                  alt="Offers"
                  width={20}
                  height={20}
                />
                <p className="figma-paragraph text-foreground">Offers</p>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-end gap-2">
                  <span className="figma-h3 leading-[60%] text-figma-primary">
                    {data.proposals.new}
                  </span>
                  <span className="text-sm text-foreground leading-[100%]">
                    New
                  </span>
                </div>
                <div className="w-px h-8 bg-foreground/20"></div>
                <div className="flex items-end gap-2">
                  <span className="figma-h3 leading-[60%] text-figma-warning">
                    {data.proposals.pending}
                  </span>
                  <span className="text-sm text-foreground leading-[100%]">
                    Pending
                  </span>
                </div>
              </div>
            </Link>
          </div>
          {/* Client Snapshot */}
          <AdminDashboardClient clients={clientsForSnapshot} />
        </div>

        {/* right contnet  */}
        <div className="space-y-6">
          {/* Messages Panel */}
          <DashboardMessagesCard
            items={messageItems}
            totalUnseen={data.unreadMessages}
            emptyText="No recent messages"
          />

          {/* News */}
          <div
            className="bg-transparent border border-primary/20 rounded-2xl px-0 py-0 shadow-md"
            style={{ minWidth: 320 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <Image
                src="/icons/news.svg"
                alt="Recent News"
                width={22}
                height={22}
                className="opacity-90"
              />
              <span className="figma-paragraph text-foreground">
                Recent news posted
              </span>
            </div>
            {/* News list */}
            <div>
              {data.news.length === 0 && (
                <div className="px-5 py-4 text-sm text-foreground/60">
                  No news posted yet.
                </div>
              )}
              {data.news.slice(0, 2).map((newsItem: any, idx: number) => (
                <Link
                  key={newsItem.id}
                  href={`/admin/news/edit/${newsItem.id}`}
                  className={`flex items-center px-5 py-4 ${
                    idx !== data.news.slice(0, 2).length - 1
                      ? "border-b border-primary/20"
                      : ""
                  } group`}
                  style={{ textDecoration: "none" }}
                >
                  {/* Image */}
                  {newsItem.featuredImage ? (
                    <div className="flex-shrink-0 w-20 h-14 rounded overflow-hidden bg-primary/20">
                      <Image
                        src={newsItem.featuredImage}
                        alt={newsItem.title}
                        width={80}
                        height={56}
                        className="object-cover w-20 h-14"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-14 bg-gradient-to-r from-primary to-primary/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-foreground">Featured</span>
                    </div>
                  )}
                  {/* Title*/}
                  <div className="ml-4 flex-1">
                    <div className="text-base font-medium leading-tight text-foreground">
                      {newsItem.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Footer link */}
            <div className="px-5 py-3 border-t border-primary/20">
              <Link
                href="/admin/news"
                className="text-sm text-foreground/80 hover:underline"
              >
                View all news
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
