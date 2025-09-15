'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  FileText, 
  MessageSquare, 
  Newspaper,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ClientDashboardData } from '@/lib/client-dashboard';

interface ClientDashboardClientProps {
  initialData: ClientDashboardData;
}

export function ClientDashboardClient({ initialData }: ClientDashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);


  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/client/dashboard');
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      }
    } catch (error) {
      console.error('Error refreshing client dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Good Morning, Client 👋</h1>
          <p className="text-gray-400 mt-1">Here's your latest updates!</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contracts Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Contracts</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-400">{data.contracts.active}</span>
              <span className="text-sm text-gray-400">Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Proposals Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Proposals to Review</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-purple-400">{data.proposals.new}</span>
                <span className="text-sm text-gray-400">New</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-orange-400">{data.proposals.pending}</span>
                <span className="text-sm text-gray-400">Pending</span>
              </div>
            </div>
            <div className="mt-2">
              <Link href="/client/proposal">
                <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white p-0 h-auto">
                  View proposals
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Messages Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-red-400">{data.unreadMessages}</span>
              <span className="text-sm text-gray-400">unseen</span>
            </div>
          </CardContent>
        </Card>

        {/* News Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Recent News</CardTitle>
            <Newspaper className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-400">{data.news.length}</span>
              <span className="text-sm text-gray-400">posts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ongoing Contracts */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Ongoing Contracts
                </CardTitle>
                <Link href="/client/contracts">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    View all contracts
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.ongoingContracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No ongoing contracts</p>
                  </div>
                ) : (
                  data.ongoingContracts.map((contract) => (
                    <div key={contract.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">{contract.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`${
                            contract.status === 'ACTIVE' 
                              ? 'border-green-500 text-green-400' 
                              : 'border-gray-500 text-gray-400'
                          }`}
                        >
                          {contract.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{contract.completedTasks} of {contract.totalTasks} tasks completed</span>
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

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Messages Panel */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Messages
                </CardTitle>
                {data.unreadMessages > 0 && (
                  <Badge variant="destructive" className="bg-red-500">
                    {data.unreadMessages}+ unseen
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentRooms.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent messages</p>
                  </div>
                ) : (
                  data.recentRooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                          {room.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{room.name}</p>
                          <p className="text-xs text-gray-400">{room.lastMessage}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))
                )}
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-white">
                    View all messages
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent News Panel */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Newspaper className="w-5 h-5 mr-2" />
                  Recent news posted
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.news.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent news</p>
                  </div>
                ) : (
                  data.news.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
                      {item.featuredImage ? (
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                          <Image
                            src={item.featuredImage}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Newspaper className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <Link href="/client/news">
                  <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-white">
                    View all news
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
