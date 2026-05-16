import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useGetAllMediaAdminQuery } from "@/redux/features/Media/mediaApi";

export default function MediaArchive() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: mediaResponse, isLoading } = useGetAllMediaAdminQuery({
    limit: isExpanded ? 20 : 5,
    status: "ARCHIVED" as any,
  });

  const archiveItems = mediaResponse?.data || [];

  const toggleView = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="bg-[#F9FAFC] shadow-lg border-gray-200">
      <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm text-gray-800">Media Archive</CardTitle>
          <p className="text-xs text-gray-600 mt-1">
            Browse archived media
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-gray-300 text-gray-700 bg-transparent cursor-pointer"
        >
          Open Archive
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">
            Archived Items
          </h3>

          <div
            className={`transition-all duration-300 ${
              isExpanded ? "overflow-y-auto" : ""
            }`}
            style={{
              maxHeight: isExpanded ? "calc(100vh - 300px)" : "auto",
            }}
          >
            {isLoading ? (
               <p className="text-center text-sm text-gray-500 py-4">Loading archive...</p>
            ) : archiveItems.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">No archived items found.</p>
            ) : (
              archiveItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 mt-4 bg-white px-3 rounded hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-600 truncate">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{item.contentType.replace("_", " ")}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={toggleView}
            className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? "View Less" : "View More"}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
