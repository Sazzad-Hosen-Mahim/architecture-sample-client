import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllMediaAdminQuery,
  useUpdateMediaMutation,
} from "@/redux/features/Media/mediaApi";
import EditMediaModal from "./EditMediaModal";

// Only World Project and Portfolio media can be featured on the home hero.
type MediaFilterType = "WORLD_PROJECT" | "PORTFOLIO";

const MEDIA_TYPE_OPTIONS: { label: string; value: MediaFilterType }[] = [
  { label: "World Project", value: "WORLD_PROJECT" },
  { label: "Portfolio", value: "PORTFOLIO" },
];

export default function HomeMediaManager() {
  const [updateMedia, { isLoading: isSavingFeatured }] = useUpdateMediaMutation();

  // Fetch featured items (isFeatured=true across all types)
  const { data: allMediaResponse, isLoading: isFetchingAll } = useGetAllMediaAdminQuery({});

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Dialog state
  const [selectedMediaType, setSelectedMediaType] = useState<MediaFilterType>("WORLD_PROJECT");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /** The featured item awaiting removal confirmation, kept so it can be named. */
  const [removeTarget, setRemoveTarget] = useState<any | null>(null);

  // Fetch media by type for the dialog dropdown
  const { data: filteredMediaResponse, isLoading: isFetchingFiltered } = useGetAllMediaAdminQuery(
    { type: selectedMediaType },
    { skip: !isDialogOpen }
  );

  const allMedia = allMediaResponse?.data || [];
  const featuredItems = allMedia.filter((item: any) => item.isFeatured);
  const dialogMediaList = filteredMediaResponse?.data || [];

  // Only PUBLISHED items can be added to the home hero — each card links through
  // to a public detail page ("Read more"), which drafts / unpublished content
  // don't have. Then narrow by the search query.
  const filteredDialogList = dialogMediaList
    .filter((item: any) => item.status === "PUBLISHED")
    .filter(
      (item: any) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.architect?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSetFeatured = async (id: string) => {
    try {
      await updateMedia({ id, data: { isFeatured: true } }).unwrap();
      toast.success("Project added to home page!");
      setIsDialogOpen(false);
      setSelectedProjectId(null);
      setSearchQuery("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to feature project");
    }
  };

  const confirmRemoveFromHome = async () => {
    if (!removeTarget) return;
    try {
      await updateMedia({
        id: removeTarget.id,
        data: { isFeatured: false },
      }).unwrap();
      toast.success("Removed from home page");
      setRemoveTarget(null);
    } catch (error: any) {
      // The dialog stays open on failure, so the action can be retried
      // without hunting for the row again.
      toast.error(error?.data?.message || "Failed to remove");
    }
  };

  const sortedFeatured = [...featuredItems].sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getTypeLabel = (contentType: string) => {
    switch (contentType) {
      case "WORLD_PROJECT": return "World Project";
      case "NEWS": return "Newsfeed";
      case "PORTFOLIO": return "Portfolio";
      case "HOME_HERO": return "Home Hero";
      default: return contentType;
    }
  };

  const getTypeBadgeColor = (contentType: string) => {
    switch (contentType) {
      case "WORLD_PROJECT": return "bg-purple-100 text-purple-800";
      case "NEWS": return "bg-blue-100 text-blue-800";
      case "PORTFOLIO": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="bg-white shadow-lg border-gray-200 mt-6">
      <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-sm text-gray-800">Home Page Management</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Control the main hero section of the website</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            className={`h-8 text-xs cursor-pointer ${isEditMode ? "bg-gray-800 text-white hover:bg-gray-700" : "border-gray-300"}`}
          >
            {isEditMode ? "Close" : "Edit"}
          </Button>
          {isEditMode && (
            <Button
              size="sm"
              onClick={() => {
                setIsDialogOpen(true);
                setSelectedProjectId(null);
                setSearchQuery("");
              }}
              className="h-8 gap-1 bg-black text-white hover:bg-gray-800 cursor-pointer"
            >
              <Plus size={14} />
              Add New
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Current Featured Projects */}
        <div className="space-y-3">
          {isFetchingAll ? (
            <p className="text-center text-xs text-gray-500 py-4">Loading home content...</p>
          ) : sortedFeatured.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
              <p className="text-sm text-gray-400">No projects featured on the home page yet</p>
              <Button
                variant="link"
                onClick={() => {
                  setIsEditMode(true);
                  setIsDialogOpen(true);
                }}
                className="text-blue-600 mt-2 cursor-pointer"
              >
                Add your first featured project
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Current Featured Projects
              </h3>
              {sortedFeatured.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200 transition-all"
                >
                  <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0 relative">
                    {item.assets?.[0]?.cdnUrl ? (
                      <img src={item.assets[0].cdnUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>
                    )}
                    {item.assets?.length > 1 && (
                      <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-1 rounded-tl">
                        {item.assets.length} imgs
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-700 truncate">{item.title}</h4>
                      <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded">ACTIVE</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${getTypeBadgeColor(item.contentType)}`}>
                        {getTypeLabel(item.contentType)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">
                      {item.location || "N/A"} • {item.projectYear || "N/A"}
                    </p>
                  </div>
                  {isEditMode && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-100 cursor-pointer"
                        onClick={() => {
                          setEditId(item.id);
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 cursor-pointer"
                        onClick={() => setRemoveTarget(item)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>

      {/* ===== Select Project Dialog ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-white p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-lg font-bold text-gray-800">
              Select Media for Home Page
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Media Type Dropdown */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Media Type</label>
                <select
                  value={selectedMediaType}
                  onChange={(e) => {
                    setSelectedMediaType(e.target.value as MediaFilterType);
                    setSelectedProjectId(null);
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {MEDIA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={`Search ${getTypeLabel(selectedMediaType)} projects...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-gray-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2 min-h-[200px] max-h-[350px]">
              {isFetchingFiltered ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredDialogList.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  No published {getTypeLabel(selectedMediaType)} projects found
                </p>
              ) : (
                filteredDialogList.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProjectId(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedProjectId === item.id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-transparent hover:bg-gray-50"
                      } ${item.isFeatured ? "opacity-50" : ""}`}
                  >
                    <div className="w-14 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                      {item.assets?.[0]?.cdnUrl ? (
                        <img src={item.assets[0].cdnUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                        {item.isFeatured && (
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                            Already Featured
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 space-x-2">
                        {item.architect && <span>Architect: {item.architect}</span>}
                        {item.photographer && <span>• Photo: {item.photographer}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-gray-500">{item.location || ""}</p>
                      <p className="text-[10px] text-gray-400">{item.projectYear || ""}</p>
                    </div>
                    {selectedProjectId === item.id && (
                      <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action button */}
            <div className="flex justify-end gap-3 pt-2 ">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedProjectId && handleSetFeatured(selectedProjectId)}
                disabled={!selectedProjectId}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Remove Confirmation ===== */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-1">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Remove from home page</DialogTitle>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                {removeTarget?.title}
              </span>{" "}
              will stop appearing in the hero section. The project itself is not
              deleted — you can feature it again at any time.
            </p>
          </DialogHeader>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setRemoveTarget(null)}
              disabled={isSavingFeatured}
              className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveFromHome}
              disabled={isSavingFeatured}
              className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSavingFeatured ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <EditMediaModal
        mediaId={editId}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </Card>
  );
}
