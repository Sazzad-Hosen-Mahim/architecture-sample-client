import { useState, useEffect } from "react";
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
import { useGetMediaByIdOrSlugQuery, useUpdateMediaMutation } from "@/redux/features/Media/mediaApi";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const media = response?.data;

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
    }
  }, [media]);

  const toggleTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
      await updateMedia({ id: mediaId!, data: updateData }).unwrap();
      toast.success("Media updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update media");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Edit Media: {media?.title || "Loading..."}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isFetching ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
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
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? "bg-blue-600 text-white"
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

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating || isFetching} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
