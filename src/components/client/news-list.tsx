"use client";

import { useState, useEffect } from "react";
import { ClientNewsCard } from "./news-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  content: string;
  featuredImage: string | null;
  sendTo: string[];
  sendToAll: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface ClientNewsListProps {
  initialNews?: NewsItem[];
}

export function ClientNewsList({ initialNews = [] }: ClientNewsListProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchNews = async (
    pageNum = 1,
    searchTerm = "",
    sort = sortBy,
    order = sortOrder
  ) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "12",
        search: searchTerm,
        sortBy: sort,
        sortOrder: order,
      });

      const response = await fetch(`/api/client/news?${params}`);
      if (response.ok) {
        const data = await response.json();

        if (pageNum === 1) {
          setNews(data.news);
        } else {
          setNews((prev) => [...prev, ...data.news]);
        }

        setTotalPages(data.pagination.pages);
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        throw new Error("Failed to fetch news");
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to fetch news");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialNews && initialNews.length > 0) {
      setIsLoading(false);
      return;
    }
    fetchNews();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchNews(1, value, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    fetchNews(1, search, field, newOrder);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage, search, sortBy, sortOrder);
  };

  if (isLoading && news.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">News & Updates</h1>
      </div>

      {/* News Grid */}
      {news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No news found</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Try adjusting your search terms"
                : "No news available at the moment"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {news.map((item) => (
              <ClientNewsCard key={item.id} news={item} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
