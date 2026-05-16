import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetMediaByIdOrSlugQuery } from "@/redux/features/Media/mediaApi";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MediaPreviewModalProps {
  mediaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaPreviewModal({
  mediaId,
  isOpen,
  onClose,
}: MediaPreviewModalProps) {
  const { data: response, isLoading } = useGetMediaByIdOrSlugQuery(mediaId || "", {
    skip: !mediaId || !isOpen,
  });

  const media = response?.data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b bg-gray-50">
          <div className="flex justify-between items-center pr-8">
            <DialogTitle className="text-xl font-bold text-gray-800">
              {isLoading || !media ? "Media Preview" : media.title}
            </DialogTitle>
            {media && (
              <Badge className={media.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {media.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !media ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              No media details found.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Carousel */}
              {media?.assets && media.assets.length > 0 ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Carousel className="w-full h-full">
                    <CarouselContent>
                      {media.assets.map((asset: any, index: number) => (
                        <CarouselItem key={index}>
                          <img
                            src={asset.cdnUrl}
                            alt={`${media.title} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {media.assets.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                      </>
                    )}
                  </Carousel>
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  No images available
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      {media?.content || "No description provided."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</h4>
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {media?.contentType?.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Meta Information</h4>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="text-xs text-gray-500">Location:</div>
                    <div className="text-xs font-medium text-gray-800">{media?.location || "N/A"}</div>
                    
                    <div className="text-xs text-gray-500">Author/Architect:</div>
                    <div className="text-xs font-medium text-gray-800">{media?.author || media?.architect || "N/A"}</div>
                    
                    <div className="text-xs text-gray-500">Created At:</div>
                    <div className="text-xs font-medium text-gray-800">
                      {media?.createdAt ? new Date(media.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                    
                    <div className="text-xs text-gray-500">View Count:</div>
                    <div className="text-xs font-medium text-gray-800">{media?.viewCount || 0}</div>
                  </div>
                  
                  {media?.projectTags && media.projectTags.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {media.projectTags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] bg-white">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
