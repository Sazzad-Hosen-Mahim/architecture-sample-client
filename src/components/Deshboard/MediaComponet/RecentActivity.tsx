import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, MoreVertical, Globe, Pencil, Trash2, Archive, RotateCcw, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useGetAllMediaAdminQuery, useUpdateMediaMutation, useDeleteMediaMutation } from "@/redux/features/Media/mediaApi";
import { useCanEdit } from "@/hooks/useDashboardAccess";
import {
  useGetYoutubeChannelQuery,
  useUpdateYoutubeChannelMutation,
} from "@/redux/api/adminDashboard/siteSettingsApi";
import { Input } from "@/components/ui/input";
import { toExternalUrl } from "@/utils/externalUrl";
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

const PAGE_SIZE = 10;

export default function RecentActivity() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // ─── YouTube channel link ───
  const { data: channelData } = useGetYoutubeChannelQuery();
  const [updateYoutubeChannel, { isLoading: isSavingChannel }] =
    useUpdateYoutubeChannelMutation();
  const savedChannelUrl = channelData?.data?.url || "";
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelInput, setChannelInput] = useState("");

  /** Passing "" clears the saved channel and puts the Connect button back. */
  const handleSaveChannel = async (override?: string) => {
    const url = (override ?? channelInput).trim();
    try {
      await updateYoutubeChannel({ url }).unwrap();
      toast.success(url ? "Channel link saved" : "Channel link removed");
      setIsEditingChannel(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not save the channel link");
    }
  };

  // The list grows without bound, so it is paged and the page itself scrolls
  // inside the card rather than stretching the column down the screen.
  const [page, setPage] = useState(1);
  const { data: mediaResponse, isLoading } = useGetAllMediaAdminQuery({
    type: filter === "ALL" ? undefined : filter,
    page,
    limit: PAGE_SIZE,
  });

  const canEdit = useCanEdit();
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
  // The admin list returns `pagination`; fall back to "a full page means there
  // is probably another one" if that ever changes shape.
  const meta: any = (mediaResponse as any)?.pagination ?? null;
  const totalPages: number | null = meta?.totalPages ?? null;
  const hasNextPage = totalPages
    ? page < totalPages
    : activities.length === PAGE_SIZE;

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
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className="text-[10px] h-7 px-2"
            >
              {f === "NEWS" ? "NEWSFEED" : f.replace("_", " ")}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
                    {/* View is the whole menu for a view-only account: an
                        employee given the media area browses the library and
                        changes nothing, and the endpoints behind these refuse
                        them anyway. */}
                    {canEdit && (
                      <>
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
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}

        </div>

        {/* Pagination sits outside the scroll area so it stays reachable. */}
        {!isLoading && (activities.length > 0 || page > 1) && (
          <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Page {page}
              {totalPages ? ` of ${totalPages}` : ""}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 w-7 p-0 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* YouTube Channel. Save a link and the Connect button becomes a
              "Go to Channel" button that opens it. */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-600 text-sm">
                YouTube Channel
              </h3>
              {savedChannelUrl && !isEditingChannel ? (
                <div className="flex items-center gap-2">
                  <a
                    href={toExternalUrl(savedChannelUrl) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Go to Channel
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setChannelInput(savedChannelUrl);
                      setIsEditingChannel(true);
                    }}
                    title="Change channel link"
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChannelInput(savedChannelUrl);
                    setIsEditingChannel(true);
                  }}
                  className="text-xs border-gray-300 text-gray-700 bg-transparent cursor-pointer"
                >
                  Connect
                </Button>
              )}
            </div>

            {isEditingChannel ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveChannel();
                      }
                    }}
                    placeholder="https://youtube.com/@yourchannel"
                    className="flex-1 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveChannel()}
                    disabled={isSavingChannel}
                    className="text-xs bg-gray-900 text-white hover:bg-black cursor-pointer"
                  >
                    {isSavingChannel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsEditingChannel(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {savedChannelUrl && (
                  <button
                    type="button"
                    onClick={() => handleSaveChannel("")}
                    disabled={isSavingChannel}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Remove saved channel
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 break-all">
                  {savedChannelUrl || "No channel linked yet."}
                </p>
              </div>
            )}
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

