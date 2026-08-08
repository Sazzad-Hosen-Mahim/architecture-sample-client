import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useGetMediaByIdOrSlugQuery,
  useUpdateMediaMutation,
  useUploadMediaAssetsMutation,
  useDeleteMediaAssetMutation,
} from "@/redux/features/Media/mediaApi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Cloud } from "lucide-react";

interface EditMediaModalProps {
  mediaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type TagType = "ECO_FRIENDLY" | "SOLAR_POWERED" | "LUXURY";
const AVAILABLE_TAGS: TagType[] = ["ECO_FRIENDLY", "SOLAR_POWERED", "LUXURY"];

const PORTFOLIO_CATEGORIES = [
  { label: "Residential", value: "RESIDENTIAL" },
  { label: "Commercial", value: "COMMERCIAL" },
  { label: "Institutional", value: "INSTITUTIONAL" },
  { label: "Landscape", value: "LANDSCAPE" },
  { label: "Interior", value: "INTERIOR" },
  { label: "Urban Planning", value: "URBAN_PLANNING" },
];

export default function EditMediaModal({
  mediaId,
  isOpen,
  onClose,
}: EditMediaModalProps) {
  const { data: response, isLoading: isFetching } = useGetMediaByIdOrSlugQuery(mediaId || "", {
    skip: !mediaId || !isOpen,
  });

  const [updateMedia, { isLoading: isUpdating }] = useUpdateMediaMutation();
  const [uploadAssets, { isLoading: isUploading }] = useUploadMediaAssetsMutation();
  const [deleteAsset] = useDeleteMediaAssetMutation();

  const media = response?.data;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [architect, setArchitect] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [category, setCategory] = useState<string>("");
  const [year, setYear] = useState("");
  const [newFilesToUpload, setNewFilesToUpload] = useState<File[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (media) {
      setTitle(media.title || "");
      setDescription(media.content || "");
      setAuthor(media.author || "");
      setLocation(media.location || "");

      // Handle date formatting for datetime-local input
      if (media.publishDate) {
        const date = new Date(media.publishDate);
        setPublishedDate(date.toISOString().slice(0, 16));
      } else {
        setPublishedDate("");
      }

      setArchitect(media.architect || "");
      setPhotographer(media.photographer || "");
      setSelectedTags(media.projectTags || []);
      setCategory(media.category || "");
      setYear(media.projectYear?.toString() || "");
      setNewFilesToUpload([]);
    }
  }, [media]);

  const toggleTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!mediaId) return;
    setDeletingAssetId(assetId);
    try {
      await deleteAsset({ mediaId, assetId }).unwrap();
      toast.success("Image removed successfully.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove image.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleNewFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFilesToUpload((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewFile = (index: number) => {
    setNewFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadNewFiles = async () => {
    if (!mediaId || newFilesToUpload.length === 0) return;
    const formData = new FormData();
    newFilesToUpload.forEach((file) => {
      formData.append("files", file);
    });
    try {
      await uploadAssets({ id: mediaId, formData }).unwrap();
      toast.success("New images uploaded successfully!");
      setNewFilesToUpload([]);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to upload images.");
    }
  };

  const handleUpdate = async () => {
    if (!title || !description) {
      toast.error("Title and Description are required.");
      return;
    }

    const updateData: any = {
      title,
      content: description,
      projectTags: selectedTags,
      projectYear: year ? parseInt(year) : undefined,
    };

    if (author) updateData.author = author;
    if (location) updateData.location = location;
    if (architect) updateData.architect = architect;
    if (photographer) updateData.photographer = photographer;
    if (category) updateData.category = category;

    if (publishedDate) {
      updateData.publishDate = new Date(publishedDate).toISOString();
    }

    try {
      // Upload new files if any
      if (newFilesToUpload.length > 0) {
        await handleUploadNewFiles();
      }

      await updateMedia({ id: mediaId!, data: updateData }).unwrap();
      toast.success("Media updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update media");
    }
  };

  const isBusy = isUpdating || isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white p-0 overflow-y-auto scrollbar-hide">
        <DialogHeader className="p-6 border-b border-gray-200">
          <DialogTitle>Edit Media: {media?.title || "Loading..."}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-5">
          {isFetching ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ===== Existing Images Section ===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images
                </label>
                {media?.assets && media.assets.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {media.assets.map((asset: any) => (
                      <div
                        key={asset.id}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100"
                      >
                        <img
                          src={asset.cdnUrl}
                          alt="Media asset"
                          className="w-full h-full object-cover"
                        />
                        {/* Always-visible delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id)}
                          disabled={deletingAssetId === asset.id}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingAssetId === asset.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <X size={14} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    No images uploaded yet
                  </p>
                )}
              </div>

              {/* ===== Upload New Images Section ===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add More Images
                </label>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleNewFilesSelected}
                  className="hidden"
                  accept="image/*"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                >
                  <Cloud className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to add images</p>
                </div>

                {/* New files to upload preview */}
                {newFilesToUpload.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newFilesToUpload.map((file, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg overflow-hidden border border-blue-200 w-20 h-20 bg-gray-100"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md cursor-pointer hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ===== Form Fields ===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24" />
              </div>

              {/* Conditional Fields based on Type */}
              {media?.contentType === "NEWS" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                    <Input type="datetime-local" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} />
                  </div>
                </div>
              )}

              {media?.contentType === "WORLD_PROJECT" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Architect</label>
                      <Input value={architect} onChange={(e) => setArchitect(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photographer</label>
                      <Input value={photographer} onChange={(e) => setPhotographer(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 cursor-pointer rounded-md text-xs font-medium transition-colors ${selectedTags.includes(tag)
                            ? "bg-gray-600 text-white"
                            : "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {tag.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {media?.contentType === "PORTFOLIO" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {PORTFOLIO_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                  </div>
                </div>
              )}

              {media?.contentType === "HOME_HERO" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Architect</label>
                      <Input value={architect} onChange={(e) => setArchitect(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photographer</label>
                      <Input value={photographer} onChange={(e) => setPhotographer(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isBusy} className="hover:bg-gray-100 cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isBusy || isFetching} className="bg-gray-600 hover:bg-gray-700 cursor-pointer text-white">
            {isBusy ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
