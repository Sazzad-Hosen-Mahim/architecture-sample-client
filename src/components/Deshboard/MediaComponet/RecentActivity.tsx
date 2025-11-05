// import React from "react";

// export default function RecentActivity() {
//   return <div>RecentActivity</div>;
// }

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import thum1 from "@/assets/pic-01.jpg";

interface ActivityItem {
  id: string;
  title: string;
  type: string;
  date: string;
  status: "published" | "draft" | "continue";
  statusLabel: string;
}

interface VideoItem {
  id: string;
  title: string;
  views: string;
  timestamp: string;
  thumbnail: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    title: "Modern Residence",
    type: "Portfolio",
    date: "2023-07-01",
    status: "published",
    statusLabel: "Published",
  },
  {
    id: "2",
    title: "Urban Loft Plans",
    type: "Plans for Sale",
    date: "2023-06-28",
    status: "continue",
    statusLabel: "Continue",
  },
  {
    id: "3",
    title: "Tokyo Skyscraper",
    type: "Global Project",
    date: "2023-06-25",
    status: "published",
    statusLabel: "Published",
  },
];

const videos: VideoItem[] = [
  {
    id: "1",
    title: "Architecture Studio Tour 1",
    views: "1.2K views",
    timestamp: "2 weeks ago",
    thumbnail: thum1,
  },
  {
    id: "2",
    title: "Architecture Studio Tour 2",
    views: "1.2K views",
    timestamp: "2 weeks ago",
    thumbnail: thum1,
  },
  {
    id: "3",
    title: "Architecture Studio Tour 3",
    views: "1.2K views",
    timestamp: "2 weeks ago",
    thumbnail: thum1,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800";
    case "draft":
      return "bg-yellow-100 text-yellow-800";
    case "continue":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function RecentActivity() {
  return (
    <Card className="bg-white shadow-lg border-gray-200">
      <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-gray-800">Recent Activity</CardTitle>
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Not Connected
        </Badge>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Activity Items */}
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="pb-4 border-b border-gray-100 last:border-b-0"
            >
              <h3 className="font-semibold text-gray-600 text-sm mb-1">
                {activity.title}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Type: {activity.type} Updated: {activity.date}
              </p>
              <div className="flex gap-2">
                <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                  {activity.statusLabel}
                </Badge>
              </div>
            </div>
          ))}

          {/* YouTube Channel Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-600 text-sm">
                YouTube Channel
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-gray-700 bg-transparent"
              >
                Connect
              </Button>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-3 gap-2">
              {videos.map((video) => (
                <div key={video.id} className="group cursor-pointer">
                  <div className="relative mb-2 overflow-hidden rounded-lg bg-gray-300 aspect-video flex items-center justify-center">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <Play className="absolute w-6 h-6 text-white  transition-opacity" />
                  </div>
                  <p className="text-xs font-medium text-gray-900 line-clamp-2">
                    {video.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {video.timestamp} • {video.views}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
