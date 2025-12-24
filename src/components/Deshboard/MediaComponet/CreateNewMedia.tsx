"use client";

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
import { Cloud, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateMediaMutation } from "@/redux/features/media/mediaApi";

type MediaType = "newsfeed" | "world-project" | "portfolio";

type TagType = "ECO_FRIENDLY" | "SOLAR_POWERED" | "LUXURY";

const AVAILABLE_TAGS: TagType[] = ["ECO_FRIENDLY", "SOLAR_POWERED", "LUXURY"];

const PORTFOLIO_CATEGORIES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Cultural",
  "Educational",
];

export default function CreateNewMedia() {
  const [activeTab, setActiveTab] = useState<MediaType>("newsfeed");
  const [createMedia, { isLoading }] = useCreateMediaMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // Newsfeed specific
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  const [publishedDate, setPublishedDate] = useState("");

  // World Project specific
  const [architect, setArchitect] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [wpLocation, setWpLocation] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

  // Portfolio specific
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const toggleTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFiles([]);
    setAuthor("");
    setLocation("");
    setPublishedDate("");
    setArchitect("");
    setPhotographer("");
    setWpLocation("");
    setSelectedTags([]);
    setCategory("");
    setYear("");
  };

  const validateForm = (): boolean => {
    if (!title || !description || selectedFiles.length === 0) {
      toast.error(
        "Please fill all required fields and select at least one file."
      );
      return false;
    }

    switch (activeTab) {
      case "newsfeed":
        if (!author || !location || !publishedDate) {
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
            "Please fill all world project fields and select at least one tag."
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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("type", activeTab);
    formData.append("description", description);

    // Add type-specific fields
    switch (activeTab) {
      case "newsfeed":
        formData.append("author", author);
        formData.append("location", location);
        formData.append("publishedDate", publishedDate);
        break;
      case "world-project":
        formData.append("architect", architect);
        formData.append("photographer", photographer);
        formData.append("location", wpLocation);
        formData.append("tags", JSON.stringify(selectedTags));
        break;
      case "portfolio":
        formData.append("category", category);
        formData.append("year", year);
        break;
    }

    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const response = await createMedia(formData).unwrap();

      if (response.success) {
        toast.success(response.message || "Media uploaded successfully!");
        resetForm();
      } else {
        toast.error(response.message || "Upload failed.");
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error?.data?.message || "An error occurred during upload.");
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
                  Location <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Dhaka, Bangladesh"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Published Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="border-gray-300"
              />
            </div>
          </>
        );

      case "world-project":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Tags <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {tag.replace("_", " ")}
                  </button>
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
                  Category <span className="text-red-500">*</span>
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-gray-300 w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-0">
                    {PORTFOLIO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              placeholder="Enter a meaningful title"
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
              placeholder="Describe your media"
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
                        prev.filter((_, i) => i !== index)
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
