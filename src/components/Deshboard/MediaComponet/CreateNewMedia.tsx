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
import { Cloud } from "lucide-react";
import { useCreateMediaMutation } from "@/redux/features/Media/mediaApi";
import { toast } from "sonner";

export default function CreateNewMedia() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("world-project");
  // const [status, setStatus] = useState("regular-upload");
  const [description, setDescription] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createMedia] = useCreateMediaMutation();

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

  // create  media post request handler

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !title ||
      !type ||
      // !status ||
      !description ||
      selectedFiles.length === 0
    ) {
      toast.error("Please fill all fields and select at least one file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("type", type);

    formData.append("description", description);
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const response = await createMedia(formData).unwrap();
      console.log("Server response:", response);

      if (response.success) {
        toast.success(response.message);
        // Reset form
        setTitle("");
        setType("world-project");
        // setStatus("regular-upload");
        setDescription("");
        setSelectedFiles([]);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error?.data?.message);
    }
  };

  return (
    <Card className="bg-[#ECFBFF] border-gray-200 shadow-lg">
      <CardHeader className=" border-b border-gray-200">
        <CardTitle className="text-sm text-gray-800">
          Create New Media
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Input
              placeholder="Enter a meaningful title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className=" border-gray-300"
            />
          </div>

          {/* Type and Status Row */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className=" border-gray-300 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-0">
                  <SelectItem value="world-project">World Project</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className=" border-gray-300 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-0">
                  <SelectItem value="regular-upload">Regular Upload</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              placeholder="Describe your media"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className=" border-gray-300 min-h-24"
            />
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFilesSelected}
            className="hidden"
          />

          {/* Upload File Area */}
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
                : "Upload files"}
            </p>
          </div>

          {/* Upload Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 cursor-pointer"
          >
            Upload Media
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
