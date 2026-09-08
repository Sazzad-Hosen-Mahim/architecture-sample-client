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
  useUpdateMediaAssetMutation,
  useDeleteMediaAssetMutation,
} from "@/redux/features/Media/mediaApi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Cloud, Crop } from "lucide-react";
import { useGetMediaQuickTagsQuery } from "@/redux/api/adminDashboard/siteSettingsApi";
import ImageCropEditor from "@/components/Common/ImageCropEditor";
import { toAssetCrop, type AssetCrop } from "@/utils/projectImage";

interface EditMediaModalProps {
  mediaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Any tag the media form can produce, not just the three built-in presets. */
type TagType = string;
const FALLBACK_TAGS: TagType[] = ["ECO_FRIENDLY", "SOLAR_POWERED", "LUXURY"];

const CONTINENTS = [
  { label: "Asia", value: "ASIA" },
  { label: "Europe", value: "EUROPE" },
  { label: "North America", value: "NORTH_AMERICA" },
  { label: "South America", value: "SOUTH_AMERICA" },
  { label: "Africa", value: "AFRICA" },
  { label: "Australia", value: "AUSTRALIA" },
];

const CLIMATES = [
  { label: "Alpine", value: "ALPINE" },
  { label: "Continental", value: "CONTINENTAL" },
  { label: "Tropical", value: "TROPICAL" },
  { label: "Desert", value: "DESERT" },
  { label: "Polar", value: "POLAR" },
  { label: "Marine", value: "MARINE" },
  { label: "Temperate", value: "TEMPERATE" },
];

/** Must stay in step with CATEGORY in CreateNewMedia — same ProjectCategory enum. */
const PORTFOLIO_CATEGORIES = [
  { label: "Commercial", value: "COMMERCIAL" },
  { label: "Residential", value: "RESIDENTIAL" },
  { label: "Interior", value: "INTERIOR" },
  { label: "Mixed Use", value: "MIXED_USE" },
  { label: "Tenant Improvement", value: "TENANT_IMPROVEMENT" },
  { label: "Remodel", value: "REMODEL" },
  { label: "Addition", value: "ADDITION" },
  { label: "Other", value: "OTHER" },
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
  const [updateAsset, { isLoading: isSavingCrop }] = useUpdateMediaAssetMutation();

  const media = response?.data;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  // News-specific
  const [publisher, setPublisher] = useState("");
  const [source, setSource] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [architect, setArchitect] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [category, setCategory] = useState<string>("");
  // Present on the create form but previously missing here, so editing a world
  // project or portfolio piece silently dropped them from the form.
  const [categoryOther, setCategoryOther] = useState("");
  const [continent, setContinent] = useState<string>("");
  const [climate, setClimate] = useState<string>("");
  const [year, setYear] = useState("");
  const [newFilesToUpload, setNewFilesToUpload] = useState<File[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  /** The asset whose crop is open for editing, if any. */
  const [croppingAsset, setCroppingAsset] = useState<any | null>(null);

  // Same curated suggestions the create form offers.
  const { data: quickTagsData } = useGetMediaQuickTagsQuery();
  const quickTags: string[] = quickTagsData?.data ?? FALLBACK_TAGS;

  const handleAddCustomTag = () => {
    const tag = newTagInput.trim().toUpperCase().replace(/\s+/g, "_");
    if (!tag) return;
    if (selectedTags.includes(tag)) {
      toast.error("Tag already added.");
      return;
    }
    setSelectedTags((prev) => [...prev, tag]);
    setNewTagInput("");
  };

  useEffect(() => {
    if (media) {
      setTitle(media.title || "");
      setDescription(media.content || "");
      setAuthor(media.author || "");
      setLocation(media.location || "");
      setPublisher(media.publisher || "");
      setSource(media.source || "");

      // Date-only inputs (no time component)
      setPublishedDate(
        media.publishDate
          ? new Date(media.publishDate).toISOString().slice(0, 10)
          : "",
      );
      setUploadDate(
        media.uploadDate
          ? new Date(media.uploadDate).toISOString().slice(0, 10)
          : "",
      );

      setArchitect(media.architect || "");
      setPhotographer(media.photographer || "");
      setSelectedTags(media.projectTags || []);
      setCategory(media.category || "");
      setCategoryOther(media.categoryOther || "");
      setContinent(media.continent || "");
      setClimate(media.climate || "");
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

  const handleSaveCrop = async (crop: AssetCrop | null) => {
    if (!mediaId || !croppingAsset) return;
    try {
      await updateAsset({
        mediaId,
        assetId: croppingAsset.id,
        data: { crop },
      }).unwrap();
      toast.success(crop ? "Crop saved." : "Crop removed.");
      setCroppingAsset(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save crop.");
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
    if (publisher) updateData.publisher = publisher;
    if (source) updateData.source = source;
    if (architect) updateData.architect = architect;
    if (photographer) updateData.photographer = photographer;
    if (category) updateData.category = category;
    if (continent) updateData.continent = continent;
    if (climate) updateData.climate = climate;
    // Only carries meaning behind the "Other" option.
    updateData.categoryOther =
      category === "OTHER" ? categoryOther.trim() || undefined : undefined;

    if (publishedDate) {
      updateData.publishDate = new Date(publishedDate).toISOString();
    }
    if (uploadDate) {
      updateData.uploadDate = new Date(uploadDate).toISOString();
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
    <>
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
                        {/* Always-visible controls */}
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          <button
                            type="button"
                            title="Choose which part of this photo the page shows"
                            onClick={() => setCroppingAsset(asset)}
                            className="bg-gray-900/80 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-900 transition-colors"
                          >
                            <Crop size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset.id)}
                            disabled={deletingAssetId === asset.id}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {deletingAssetId === asset.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <X size={14} />
                            )}
                          </button>
                        </div>
                        {toAssetCrop(asset.crop) && (
                          <span className="absolute bottom-0 left-0 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-tr">
                            Cropped
                          </span>
                        )}
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
                {/* A portfolio or world-project entry is a project, so its
                    title is its project name. News keeps "Title". */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {media?.contentType === "PORTFOLIO" ||
                  media?.contentType === "WORLD_PROJECT"
                    ? "Project Name"
                    : "Title"}
                </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                    <Input
                      placeholder="e.g., The Independent"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo Credits</label>
                    <Input
                      placeholder="Photographer name"
                      value={photographer}
                      onChange={(e) => setPhotographer(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source name</label>
                    <Input
                      placeholder="e.g., Reuters"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                    <Input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                    <Input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
                      <Select value={continent} onValueChange={setContinent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select continent" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {CONTINENTS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Climate</label>
                      <Select value={climate} onValueChange={setClimate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select climate" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {CLIMATES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {PORTFOLIO_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {category === "OTHER" && (
                        <Input
                          value={categoryOther}
                          onChange={(e) => setCategoryOther(e.target.value)}
                          placeholder="Describe the category..."
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>

                    {/* Selected tags, including custom ones already on this
                        media — previously invisible and impossible to remove. */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-700 text-white"
                          >
                            {tag.replace(/_/g, " ")}
                            <button
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className="rounded-full hover:bg-gray-800 p-0.5 cursor-pointer"
                              aria-label={`Remove ${tag.replace(/_/g, " ")}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Type a custom tag..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomTag();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomTag}
                        className="bg-gray-800 hover:bg-black text-white px-3 cursor-pointer"
                      >
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 self-center mr-1">
                        Quick add:
                      </span>
                      {quickTags
                        .filter((tag) => !selectedTags.includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="px-3 py-1 cursor-pointer rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                          >
                            + {tag.replace(/_/g, " ")}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio collects the same fields as a world project on the
                  create form, so the edit form has to offer all of them too. */}
              {media?.contentType === "PORTFOLIO" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photographer</label>
                      <Input value={photographer} onChange={(e) => setPhotographer(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
                      <Select value={continent} onValueChange={setContinent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select continent" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {CONTINENTS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Climate</label>
                      <Select value={climate} onValueChange={setClimate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select climate" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {CLIMATES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {PORTFOLIO_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {category === "OTHER" && (
                        <Input
                          value={categoryOther}
                          onChange={(e) => setCategoryOther(e.target.value)}
                          placeholder="Describe the category..."
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>

                    {/* Selected tags, including custom ones already on this
                        media — previously invisible and impossible to remove. */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-700 text-white"
                          >
                            {tag.replace(/_/g, " ")}
                            <button
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className="rounded-full hover:bg-gray-800 p-0.5 cursor-pointer"
                              aria-label={`Remove ${tag.replace(/_/g, " ")}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Type a custom tag..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomTag();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomTag}
                        className="bg-gray-800 hover:bg-black text-white px-3 cursor-pointer"
                      >
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 self-center mr-1">
                        Quick add:
                      </span>
                      {quickTags
                        .filter((tag) => !selectedTags.includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="px-3 py-1 cursor-pointer rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                          >
                            + {tag.replace(/_/g, " ")}
                          </button>
                        ))}
                    </div>
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

    {/* Keyed by asset so switching photos starts the editor over rather than
        carrying the previous one's boxes across. A sibling of the edit modal
        rather than a child, so the two dialogs do not nest. */}
    {croppingAsset && (
      <ImageCropEditor
        key={croppingAsset.id}
        open
        onClose={() => setCroppingAsset(null)}
        imageUrl={croppingAsset.cdnUrl}
        imageWidth={croppingAsset.width}
        imageHeight={croppingAsset.height}
        initialCrop={toAssetCrop(croppingAsset.crop)}
        onSave={handleSaveCrop}
        isSaving={isSavingCrop}
      />
    )}
    </>
  );
}
