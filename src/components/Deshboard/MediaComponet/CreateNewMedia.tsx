import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cloud, X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useGetMediaQuickTagsQuery,
  useUpdateMediaQuickTagsMutation,
} from "@/redux/api/adminDashboard/siteSettingsApi";
import {
  useCreateMediaMutation,
  useUploadMediaAssetsMutation,
} from "@/redux/features/Media/mediaApi";

interface EnumConfig<T extends string> {
  value: T;
  label: string;
}

type MediaType = "newsfeed" | "world-project" | "portfolio";

const PRESET_TAGS = ["ECO_FRIENDLY", "SOLAR_POWERED", "LUXURY"];

type ContinentType =
  | "ASIA"
  | "EUROPE"
  | "NORTH_AMERICA"
  | "SOUTH_AMERICA"
  | "AFRICA"
  | "AUSTRALIA";
type ClimateType =
  | "ALPINE"
  | "CONTINENTAL"
  | "TROPICAL"
  | "DESERT"
  | "POLAR"
  | "MARINE"
  | "TEMPERATE";
type CategoryType =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INTERIOR"
  | "MIXED_USE"
  | "TENANT_IMPROVEMENT"
  | "REMODEL"
  | "ADDITION"
  | "OTHER";

// const PORTFOLIO_CATEGORIES = [
//   { label: "Residential", value: "RESIDENTIAL" },
//   { label: "Commercial", value: "COMMERCIAL" },
//   { label: "Institutional", value: "INSTITUTIONAL" },
//   { label: "Landscape", value: "LANDSCAPE" },
//   { label: "Interior", value: "INTERIOR" },
//   { label: "Urban Planning", value: "URBAN_PLANNING" },
// ];

export default function CreateNewMedia() {
  const [activeTab, setActiveTab] = useState<MediaType>("newsfeed");
  const [createMedia, { isLoading: isMetadataLoading }] =
    useCreateMediaMutation();
  const [uploadAssets, { isLoading: isUploadLoading }] =
    useUploadMediaAssetsMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isLoading = isMetadataLoading || isUploadLoading;

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // Newsfeed specific
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [source, setSource] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  // Upload date defaults to today and can be adjusted before submitting.
  const [uploadDate, setUploadDate] = useState(todayStr());

  // World Project specific
  const [architect, setArchitect] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [wpLocation, setWpLocation] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  /** Whether a newly typed tag also joins the shared Quick add suggestions. */
  const [saveTagToQuickAdd, setSaveTagToQuickAdd] = useState(false);

  const { data: quickTagsData } = useGetMediaQuickTagsQuery();
  const [updateMediaQuickTags] = useUpdateMediaQuickTagsMutation();
  const quickTags: string[] = quickTagsData?.data ?? PRESET_TAGS;
  const [continent, setContinent] = useState<ContinentType | "">("");
  const [climate, setClimate] = useState<ClimateType | "">("");

  // Portfolio specific
  const [category, setCategory] = useState<string>("");
  /** Free text describing the category when "Other" is chosen. */
  const [categoryOther, setCategoryOther] = useState("");
  const [year, setYear] = useState("");

  // continent type and climate

  const CONTINENT_CONFIGS: EnumConfig<ContinentType>[] = [
    { value: "ASIA", label: "Asia" },
    { value: "EUROPE", label: "Europe" },
    { value: "NORTH_AMERICA", label: "North America" },
    { value: "SOUTH_AMERICA", label: "South America" },
    { value: "AFRICA", label: "Africa" },
    { value: "AUSTRALIA", label: "Australia" },
  ];

  const CLIMATE_CONFIGS: EnumConfig<ClimateType>[] = [
    { value: "ALPINE", label: "Alpine" },
    { value: "CONTINENTAL", label: "Continental" },
    { value: "TROPICAL", label: "Tropical" },
    { value: "DESERT", label: "Desert" },
    { value: "POLAR", label: "Polar" },
    { value: "MARINE", label: "Marine" },
    { value: "TEMPERATE", label: "Temperate" },
  ];

  const CATEGORY: EnumConfig<CategoryType>[] = [
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "INTERIOR", label: "Interior" },
    { value: "MIXED_USE", label: "Mixed Use" },
    { value: "TENANT_IMPROVEMENT", label: "Tenant Improvement" },
    { value: "REMODEL", label: "Remodel" },
    { value: "ADDITION", label: "Addition" },
    { value: "OTHER", label: "Other" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const MAX_IMAGES = 10;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => {
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_IMAGES) {
          toast.error(
            `Maximum ${MAX_IMAGES} images allowed. Only first ${MAX_IMAGES} kept.`,
          );
          return combined.slice(0, MAX_IMAGES);
        }
        return combined;
      });
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => {
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_IMAGES) {
          toast.error(
            `Maximum ${MAX_IMAGES} images allowed. Only first ${MAX_IMAGES} kept.`,
          );
          return combined.slice(0, MAX_IMAGES);
        }
        return combined;
      });
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = async () => {
    const tag = newTagInput.trim().toUpperCase().replace(/\s+/g, "_");
    if (!tag) return;
    if (selectedTags.includes(tag)) {
      toast.error("Tag already exists.");
      return;
    }
    setSelectedTags((prev) => [...prev, tag]);
    setNewTagInput("");

    // Optionally keep it around as a suggestion for next time.
    if (saveTagToQuickAdd && !quickTags.includes(tag)) {
      try {
        await updateMediaQuickTags({ tags: [...quickTags, tag] }).unwrap();
        toast.success(`"${tag.replace(/_/g, " ")}" saved to Quick add.`);
      } catch {
        toast.error("Tag added, but it could not be saved to Quick add.");
      }
    }
  };

  /** Takes a tag out of the Quick add suggestions. Published media keep it. */
  const handleRemoveQuickTag = async (tag: string) => {
    try {
      await updateMediaQuickTags({
        tags: quickTags.filter((t) => t !== tag),
      }).unwrap();
      toast.success(`"${tag.replace(/_/g, " ")}" removed from Quick add.`);
    } catch {
      toast.error("Failed to remove that suggestion.");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFiles([]);
    setAuthor("");
    setPublisher("");
    setSource("");
    setPublishedDate("");
    setUploadDate(todayStr());
    setArchitect("");
    setPhotographer("");
    setWpLocation("");
    setSelectedTags([]);
    setNewTagInput("");
    setCategory("");
    setCategoryOther("");
    setYear("");
  };

  const validateForm = (): boolean => {
    if (!title || !description) {
      toast.error("Please fill the title and description.");
      return false;
    }
    if (selectedFiles.length < 1) {
      toast.error("Please upload at least 1 photo.");
      return false;
    }
    if (selectedFiles.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} photos allowed.`);
      return false;
    }

    switch (activeTab) {
      case "newsfeed":
        if (!author || !publisher || !source || !publishedDate || !uploadDate) {
          toast.error("Please fill all newsfeed fields.");
          return false;
        }
        break;
      case "world-project":
        if (
          !architect ||
          !photographer ||
          !wpLocation ||
          selectedTags.length === 0
        ) {
          toast.error(
            "Please fill all world project fields and select at least one tag.",
          );
          return false;
        }
        break;
      case "portfolio":
        if (!category || !year) {
          toast.error("Please fill all portfolio fields.");
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Map types to backend enums
    const contentTypeMap: Record<MediaType, string> = {
      newsfeed: "NEWS",
      "world-project": "WORLD_PROJECT",
      portfolio: "PORTFOLIO",
    };

    // Step 1: Prepare metadata for initial creation
    const metadata: any = {
      contentType: contentTypeMap[activeTab],
      title: title,
      content: description, // Backend field is "content"
    };

    // Add type-specific fields
    switch (activeTab) {
      case "newsfeed":
        metadata.author = author;
        metadata.publisher = publisher;
        metadata.source = source;
        metadata.photographer = photographer;
        metadata.publishDate = new Date(publishedDate).toISOString();
        metadata.uploadDate = new Date(uploadDate).toISOString();
        break;
      case "world-project":
        metadata.architect = architect;
        metadata.photographer = photographer;
        metadata.location = wpLocation;
        metadata.projectTags = selectedTags; // Backend field is "projectTags"
        metadata.continent = continent; // Backend field is "continent"
        metadata.climate = climate; // Backend field is "climate"
        metadata.category = category;
        // Only meaningful behind the "Other" option.
        if (category === "OTHER" && categoryOther.trim()) {
          metadata.categoryOther = categoryOther.trim();
        }
        metadata.projectYear = parseInt(year); // Backend field is "projectYear"
        break;
      case "portfolio":
        metadata.category = category; // Enum value (e.g., RESIDENTIAL)
        if (category === "OTHER" && categoryOther.trim()) {
          metadata.categoryOther = categoryOther.trim();
        }
        metadata.projectYear = parseInt(year); // Backend field is "projectYear"
        // Portfolio also collects these — persist them so the detail page can
        // show something other than "TBA".
        if (photographer) metadata.photographer = photographer;
        if (wpLocation) metadata.location = wpLocation;
        if (continent) metadata.continent = continent;
        if (climate) metadata.climate = climate;
        break;
    }

    try {
      // 1. Create Media Metadata
      console.log("Creating media metadata:", metadata);
      const metadataResponse = await createMedia(metadata).unwrap();

      const mediaId = metadataResponse.data?.id;
      if (!mediaId) {
        throw new Error("Metadata created but no media ID returned.");
      }

      // 2. Upload Assets
      console.log(
        `Step 2: Uploading ${selectedFiles.length} files for media ID: ${mediaId}`,
      );
      const assetFormData = new FormData();
      selectedFiles.forEach((file) => {
        assetFormData.append("files", file); // Backend expects "files" (plural) in FilesInterceptor
      });

      const assetResponse = await uploadAssets({
        id: mediaId,
        formData: assetFormData,
      }).unwrap();

      if (assetResponse.status === "success") {
        toast.success("Media uploaded successfully!");
        resetForm();
      } else {
        toast.error(assetResponse.message || "File upload failed.");
      }
    } catch (error: any) {
      console.error("Multi-step upload failed:", error);
      toast.error(
        error?.data?.message ||
          error.message ||
          "An error occurred during upload.",
      );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "newsfeed":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter author name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publisher <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., The Independent"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Credits <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter photographer name"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Reuters"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Published Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="border-gray-300"
                />
                <p className="mt-1 text-xs text-gray-500">Defaults to today.</p>
              </div>
            </div>
          </>
        );

      case "world-project":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Continent <span className="text-red-500">*</span>
                </label>
                <Select
                  value={continent}
                  onValueChange={(val) => setContinent(val as ContinentType)}
                >
                  <SelectTrigger className="border-gray-300 w-full text-gray-500">
                    <SelectValue placeholder="Select Continent" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CONTINENT_CONFIGS.map((config) => (
                      <SelectItem
                        key={config.value}
                        value={config.value}
                        className="text-gray-700 cursor-pointer"
                      >
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Climate <span className="text-red-500">*</span>
                </label>
                <Select
                  value={climate}
                  onValueChange={(val) => setClimate(val as ClimateType)}
                >
                  <SelectTrigger className="border-gray-300 w-full text-gray-500">
                    <SelectValue placeholder="Select Climate" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CLIMATE_CONFIGS.map((config) => (
                      <SelectItem
                        key={config.value}
                        value={config.value}
                        className="text-gray-700 cursor-pointer"
                      >
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Architect <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter architect name"
                  value={architect}
                  onChange={(e) => setArchitect(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photographer <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter photographer name"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Dubai, UAE"
                  value={wpLocation}
                  onChange={(e) => setWpLocation(e.target.value)}
                  className="border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border-gray-300"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val)}
              >
                <SelectTrigger className="border-gray-300 w-full text-gray-500">
                  <SelectValue placeholder="Select Project Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  {CATEGORY.map((config) => (
                    <SelectItem
                      key={config.value}
                      value={config.value}
                      className="text-gray-700 cursor-pointer hover:bg-gray-800 hover:text-white"
                    >
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* "Other" is only meaningful with a description of what it is. */}
              {category === "OTHER" && (
                <Input
                  value={categoryOther}
                  onChange={(e) => setCategoryOther(e.target.value)}
                  placeholder="Describe the category..."
                  className="border-gray-300 mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags <span className="text-red-500">*</span>
              </label>

              {/* Selected tags with cross to remove */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white"
                    >
                      {tag.replace(/_/g, " ")}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full hover:bg-blue-700 p-0.5 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add custom tag input */}
              <div className="flex gap-2 mb-3">
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
                  className="border-gray-300 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 cursor-pointer"
                  size="sm"
                >
                  <Plus size={16} />
                </Button>
              </div>

              <label className="flex items-center gap-2 mb-3 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveTagToQuickAdd}
                  onChange={(e) => setSaveTagToQuickAdd(e.target.checked)}
                  className="rounded border-gray-300 cursor-pointer"
                />
                Also save this tag to Quick add for next time
              </label>

              {/* Quick add suggestions. The X removes a suggestion for
                  everyone — media already tagged with it keeps the tag. */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center mr-1">
                  Quick add:
                </span>
                {quickTags
                  .filter((tag) => !selectedTags.includes(tag))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-gray-200 text-gray-700 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="px-3 py-1.5 text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        + {tag.replace(/_/g, " ")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickTag(tag)}
                        title="Remove from Quick add"
                        aria-label={`Remove ${tag.replace(/_/g, " ")} from Quick add`}
                        className="px-1.5 py-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          </>
        );

      case "portfolio":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Continent <span className="text-red-500">*</span>
                </label>
                <Select
                  value={continent}
                  onValueChange={(val) => setContinent(val as ContinentType)}
                >
                  <SelectTrigger className="border-gray-300 w-full text-gray-500">
                    <SelectValue placeholder="Select Continent" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CONTINENT_CONFIGS.map((config) => (
                      <SelectItem
                        key={config.value}
                        value={config.value}
                        className="text-gray-700 cursor-pointer"
                      >
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Climate <span className="text-red-500">*</span>
                </label>
                <Select
                  value={climate}
                  onValueChange={(val) => setClimate(val as ClimateType)}
                >
                  <SelectTrigger className="border-gray-300 w-full text-gray-500">
                    <SelectValue placeholder="Select Climate" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CLIMATE_CONFIGS.map((config) => (
                      <SelectItem
                        key={config.value}
                        value={config.value}
                        className="text-gray-700 cursor-pointer"
                      >
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photographer <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter photographer name"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Dubai, UAE"
                  value={wpLocation}
                  onChange={(e) => setWpLocation(e.target.value)}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border-gray-300"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val)}
              >
                <SelectTrigger className="border-gray-300 w-full text-gray-500">
                  <SelectValue placeholder="Select Project Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {CATEGORY.map((config) => (
                    <SelectItem
                      key={config.value}
                      value={config.value}
                      className="text-gray-700 cursor-pointer"
                    >
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* "Other" is only meaningful with a description of what it is. */}
              {category === "OTHER" && (
                <Input
                  value={categoryOther}
                  onChange={(e) => setCategoryOther(e.target.value)}
                  placeholder="Describe the category..."
                  className="border-gray-300 mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags <span className="text-red-500">*</span>
              </label>

              {/* Selected tags with cross to remove */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white"
                    >
                      {tag.replace(/_/g, " ")}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full hover:bg-blue-700 p-0.5 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add custom tag input */}
              <div className="flex gap-2 mb-3">
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
                  className="border-gray-300 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 cursor-pointer"
                  size="sm"
                >
                  <Plus size={16} />
                </Button>
              </div>

              <label className="flex items-center gap-2 mb-3 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveTagToQuickAdd}
                  onChange={(e) => setSaveTagToQuickAdd(e.target.checked)}
                  className="rounded border-gray-300 cursor-pointer"
                />
                Also save this tag to Quick add for next time
              </label>

              {/* Quick add suggestions. The X removes a suggestion for
                  everyone — media already tagged with it keeps the tag. */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center mr-1">
                  Quick add:
                </span>
                {quickTags
                  .filter((tag) => !selectedTags.includes(tag))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-gray-200 text-gray-700 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="px-3 py-1.5 text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        + {tag.replace(/_/g, " ")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickTag(tag)}
                        title="Remove from Quick add"
                        aria-label={`Remove ${tag.replace(/_/g, " ")} from Quick add`}
                        className="px-1.5 py-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Card className="bg-[#ECFBFF] border-gray-200 shadow-lg">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-sm text-gray-800">
          Create New Media
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: "newsfeed", label: "Newsfeed" },
            { id: "world-project", label: "World Project" },
            { id: "portfolio", label: "Portfolio" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as MediaType)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Common Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter Project Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Describe the Project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-gray-300 min-h-24"
            />
          </div>

          {/* Tab-Specific Fields */}
          {renderTabContent()}

          {/* File Upload */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFilesSelected}
            className="hidden"
            accept="image/*"
          />

          <div
            onClick={handleClickUpload}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"
            }`}
          >
            <Cloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file(s) selected`
                : "Upload images"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Click or drag and drop images here
            </p>
          </div>

          {/* Image count indicator */}
          <p
            className={`text-xs font-medium ${
              selectedFiles.length === 0
                ? "text-red-500"
                : selectedFiles.length >= MAX_IMAGES
                  ? "text-orange-500"
                  : "text-green-600"
            }`}
          >
            {selectedFiles.length} / {MAX_IMAGES} photos selected
            {selectedFiles.length === 0 && " (minimum 1 required)"}
          </p>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-md px-3 py-2 text-sm border border-gray-300 flex items-center gap-2"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Uploading..." : "Upload Media"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
