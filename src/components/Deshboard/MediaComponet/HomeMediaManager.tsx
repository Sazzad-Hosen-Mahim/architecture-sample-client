import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Trash2, CheckCircle, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateMediaMutation,
  useUploadMediaAssetsMutation,
  useGetAllMediaAdminQuery,
  useUpdateMediaMutation,
  useDeleteMediaMutation
} from "@/redux/features/Media/mediaApi";
import EditMediaModal from "./EditMediaModal";

export default function HomeMediaManager() {
  const [createMedia, { isLoading: isMetadataLoading }] = useCreateMediaMutation();
  const [uploadAssets, { isLoading: isUploadLoading }] = useUploadMediaAssetsMutation();
  const [updateMedia] = useUpdateMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  const { data: homeMediaResponse, isLoading: isFetching } = useGetAllMediaAdminQuery({
    type: "HOME_HERO" as any,
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [architect, setArchitect] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const homeItems = homeMediaResponse?.data || [];
  const isLoading = isMetadataLoading || isUploadLoading;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !selectedFile) {
      toast.error("Please fill required fields and select an image.");
      return;
    }

    try {
      // 1. Create Metadata
      const metadata = {
        contentType: "HOME_HERO",
        title,
        content: description,
        photographer,
        architect,
        projectYear: parseInt(year),
        location,
        status: "PUBLISHED" // Home hero items should be published by default
      };

      const response = await createMedia(metadata).unwrap();
      const mediaId = response.data?.id;

      // 2. Upload Asset
      const formData = new FormData();
      formData.append("files", selectedFile);

      await uploadAssets({ id: mediaId, formData }).unwrap();

      toast.success("Home page content updated!");
      setIsAddingNew(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save home content");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPhotographer("");
    setArchitect("");
    setYear("");
    setLocation("");
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this home page content?")) {
      try {
        await deleteMedia(id).unwrap();
        toast.success("Deleted successfully");
      } catch (error: any) {
        toast.error("Failed to delete");
      }
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await updateMedia({ id, data: { isFeatured: true } }).unwrap();
      toast.success("Home page design set as active!");
    } catch (error) {
      toast.error("Failed to set active design");
    }
  };

  const sortedHomeItems = [...homeItems].sort((a: any, b: any) => {
    // Featured first, then by date
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card className="bg-white shadow-lg border-gray-200 mt-6">
      <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-sm text-gray-800">Home Page Management</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Control the main hero section of the website</p>
        </div>
        {!isAddingNew && (
          <Button size="sm" onClick={() => setIsAddingNew(true)} className="h-8 gap-1 bg-black text-white hover:bg-gray-800 cursor-pointer">
            <Plus size={14} />
            Add New
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {isAddingNew ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Main Heading" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Year</label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Description *</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hero subtext..." className="h-20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Architect</label>
                <Input value={architect} onChange={(e) => setArchitect(e.target.value)} placeholder="Architect Name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Photographer</label>
                <Input value={photographer} onChange={(e) => setPhotographer(e.target.value)} placeholder="Photographer Name" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dubai, UAE" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Hero Image *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                <Cloud className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">
                  {selectedFile ? selectedFile.name : "Click to upload single hero image"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                {isLoading ? "Saving..." : "Save & Create"}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingNew(false)} className="cursor-pointer">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isFetching ? (
              <p className="text-center text-xs text-gray-500 py-4">Loading home content...</p>
            ) : sortedHomeItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                <p className="text-sm text-gray-400">No home page content created yet</p>
                <Button variant="link" onClick={() => setIsAddingNew(true)} className="text-blue-600 mt-2 cursor-pointer">
                  Create your first hero section
                </Button>
              </div>
            ) : (
              sortedHomeItems.map((item: any) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg group border transition-all ${item.isFeatured ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                  <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0 relative">
                    {item.assets?.[0]?.cdnUrl ? (
                      <img src={item.assets[0].cdnUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>
                    )}
                    {item.isFeatured && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <CheckCircle size={16} className="text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-700 truncate">{item.title}</h4>
                      {item.isFeatured && <span className="text-[8px] bg-blue-600 text-white px-1 rounded">ACTIVE</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{item.location} • {item.projectYear}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isFeatured && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer"
                        onClick={() => handleSetActive(item.id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 cursor-pointer"
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
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      <EditMediaModal
        mediaId={editId}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </Card>
  );
}
