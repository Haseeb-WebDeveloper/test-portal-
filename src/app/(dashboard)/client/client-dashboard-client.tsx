"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ClientDashboardData } from "@/lib/client-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { getGreeting } from "@/utils/greeting";
import DashboardMessagesCard, {
  MessagesCardItem,
} from "@/components/common/dashboard-messages-card";
import useSWR from "swr";

interface ClientDashboardClientProps {
  initialData: ClientDashboardData;
}

export function ClientDashboardClient({
  initialData,
}: ClientDashboardClientProps) {
  const [data, setData] = useState(initialData);
  const { user } = useAuth();

  // SWR for dashboard data with 60s cache
  const { data: swrData } = useSWR(
    "/api/client/dashboard",
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load dashboard");
      return (await res.json()) as ClientDashboardData;
    },
    { 
      fallbackData: initialData, 
      revalidateOnFocus: false, 
      keepPreviousData: true, 
      dedupingInterval: 60000, 
      refreshInterval: 0 
    }
  );

  // Update local state when SWR data changes
  useEffect(() => {
    if (swrData && swrData !== data) {
      setData(swrData);
    }
  }, [swrData, data]);

  const messageItems: MessagesCardItem[] = (data.recentRooms || []).map(
    (room) => ({
      id: room.id,
      title: room.name,
      subtitle: room.lastMessage ?? "",
      avatarUrl: null,
      avatarFallback: (room.name?.[0] || "?").toUpperCase(),
      href: `/messages?roomId=${room.id}`,
    })
  );

  // Remove refreshData function as SWR handles revalidation automatically

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
        {/* Refresh button removed - SWR handles automatic revalidation */}
      </div>

      {/* Main contetn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contracts Card */}
            <Link
              href="/client/contracts"
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
              </div>
            </Link>

            {/* Proposals Card */}
            <Link
              href="/client/proposal"
              className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/list.svg"
                  alt="Proposals"
                  width={20}
                  height={20}
                />
                <p className="figma-paragraph text-foreground">Proposals</p>
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

          {/* Ongoing Contracts */}
          <div className="lg:col-span-2">
            <Card className="bg-transparent border border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center">
                    Ongoing Contracts
                  </CardTitle>
                  <Link href="/client/contracts">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground/70 hover:text-foreground"
                    >
                      View all contracts
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ongoingContracts.length === 0 ? (
                    <div className="text-center py-8 text-foreground/60">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No ongoing contracts</p>
                    </div>
                  ) : (
                    data.ongoingContracts.map((contract) => (
                      <div
                        key={contract.id}
                        className=""
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-foreground">
                            {contract.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${
                              contract.status === "ACTIVE"
                                ? "border-green-500 text-green-400"
                                : "border-primary/30 text-foreground/70"
                            }`}
                          >
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-foreground/70">
                            <span>
                              {contract.completedTasks} of {contract.totalTasks}{" "}
                              tasks completed
                            </span>
                            <span>{contract.progressPercentage}%</span>
                          </div>
                          <Progress
                            value={contract.progressPercentage}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Messages Panel - unified with admin */}
          <DashboardMessagesCard
            items={messageItems}
            totalUnseen={data.unreadMessages}
            emptyText="No recent messages"
          />

          {/* Recent News - unified with admin */}
          <div
            className="bg-transparent border border-primary/20 rounded-2xl px-0 py-0 shadow-md"
            style={{ minWidth: 320 }}
          >
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
            <div>
              {data.news.length === 0 && (
                <div className="px-5 py-4 text-sm text-foreground/60">
                  No news posted yet.
                </div>
              )}
              {data.news.slice(0, 2).map((newsItem, idx) => (
                <Link
                  key={newsItem.id}
                  href="/client/news"
                  className={`flex items-center px-5 py-4 ${
                    idx !== data.news.slice(0, 2).length - 1
                      ? "border-b border-primary/20"
                      : ""
                  } group`}
                  style={{ textDecoration: "none" }}
                >
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
                  <div className="ml-4 flex-1">
                    <div className="text-base font-medium leading-tight text-foreground">
                      {newsItem.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-primary/20">
              <Link
                href="/client/news"
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
