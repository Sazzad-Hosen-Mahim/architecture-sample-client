import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, MoreVertical, Globe, Pencil, Trash2, Archive, RotateCcw } from "lucide-react";
import { useGetAllMediaAdminQuery, useUpdateMediaMutation, useDeleteMediaMutation } from "@/redux/features/Media/mediaApi";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MediaPreviewModal from "./MediaPreviewModal";
import EditMediaModal from "./EditMediaModal";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "ARCHIVED":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

type FilterType = "ALL" | "PORTFOLIO" | "WORLD_PROJECT" | "NEWS";

export default function RecentActivity() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: mediaResponse, isLoading } = useGetAllMediaAdminQuery({
    type: filter === "ALL" ? undefined : filter,
    limit: 10
  });

  const [updateMedia] = useUpdateMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  const handlePreview = (id: string) => {
    setPreviewId(id);
    setIsPreviewOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setIsEditOpen(true);
  };

  const handlePublish = async (id: string) => {
    try {
      await updateMedia({ id, data: { status: "PUBLISHED" } }).unwrap();
      toast.success("Media published successfully!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to publish media");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this media?")) {
      try {
        await deleteMedia(id).unwrap();
        toast.success("Media deleted successfully!");
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to delete media");
      }
    }
  };

  const activities = mediaResponse?.data || [];

  return (
    <Card className="bg-white shadow-lg border-gray-200">
      <CardHeader className="border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle className="text-sm text-gray-800">Recent Activity</CardTitle>
        <div className="flex gap-1 flex-wrap">
          {(["ALL", "PORTFOLIO", "WORLD_PROJECT", "NEWS"] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-[10px] h-7 px-2"
            >
              {f === "NEWS" ? "Newsfeed" : f.replace("_", " ")}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500 py-4">Loading activity...</p>
          ) : activities.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">No recent activity found.</p>
          ) : (
            activities.map((activity: any) => (
              <div
                key={activity.id}
                className="pb-4 border-b border-gray-100 last:border-b-0 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-600 text-sm mb-1 line-clamp-1">
                    {activity.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Type: {activity.contentType.replace("_", " ")} • Updated: {new Date(activity.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Badge className={`text-[10px] ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem
                      onClick={() => handlePreview(activity.id)}
                      className="cursor-pointer"
                    >
                      <Play className="mr-2 h-4 w-4 text-gray-600" />
                      <span>View</span>
                    </DropdownMenuItem>
                    {activity.status !== "PUBLISHED" && (
                      <DropdownMenuItem onClick={() => handlePublish(activity.id)} className="cursor-pointer">
                        <Globe className="mr-2 h-4 w-4 text-green-600" />
                        <span>Publish</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleEdit(activity.id)}
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    {activity.status !== "ARCHIVED" ? (
                      <DropdownMenuItem
                        onClick={() => {
                          updateMedia({ id: activity.id, data: { status: "ARCHIVED" } }).unwrap();
                          toast.success("Media archived!");
                        }}
                        className="cursor-pointer"
                      >
                        <Archive className="mr-2 h-4 w-4 text-orange-600" />
                        <span>Archive</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          updateMedia({ id: activity.id, data: { status: "DRAFT" } }).unwrap();
                          toast.success("Media restored to draft!");
                        }}
                        className="cursor-pointer"
                      >
                        <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Restore to Draft</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(activity.id)} className="text-red-600 cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}

          {/* YouTube Channel Section (Placeholder for now) */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-600 text-sm">
                YouTube Channel
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-gray-700 bg-transparent cursor-pointer"
              >
                Connect
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">YouTube integration coming soon</p>
            </div>
          </div>
        </div>
      </CardContent>

      <MediaPreviewModal
        mediaId={previewId}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      <EditMediaModal
        mediaId={editId}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </Card>
  );
}

