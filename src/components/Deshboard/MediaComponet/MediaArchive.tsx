import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ArchiveItem {
  id: string;
  title: string;
  type: string;
  views: number;
  hasIndicator?: boolean;
}

const archiveItems: ArchiveItem[] = [
  {
    id: "1",
    title: "Modern Residence",
    type: "Portfolio",
    views: 342,
    hasIndicator: true,
  },
  { id: "2", title: "Sustainable Design Article", type: "Article", views: 289 },
  { id: "3", title: "Urban Loft Plans", type: "Plans", views: 156 },
  {
    id: "4",
    title: "Tokyo Tower Project",
    type: "Global Project",
    views: 132,
    hasIndicator: true,
  },
  { id: "5", title: "Eco-Friendly Office", type: "Article", views: 98 },
  { id: "6", title: "Minimalist Apartment", type: "Portfolio", views: 75 },
  { id: "7", title: "Green Roof Design", type: "Article", views: 61 },
  { id: "8", title: "Office Space Layout", type: "Plans", views: 48 },
  { id: "9", title: "City Park Proposal", type: "Global Project", views: 39 },
  { id: "10", title: "Tiny House Design", type: "Portfolio", views: 27 },
];

export default function MediaArchive() {
  const [visibleCount, setVisibleCount] = useState(5); // Initial items to show
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleView = () => {
    if (isExpanded) {
      setVisibleCount(5);
    } else {
      setVisibleCount(archiveItems.length);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="bg-[#F9FAFC] shadow-lg border-gray-200">
      <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm text-gray-800">Media Archive</CardTitle>
          <p className="text-xs text-gray-600 mt-1">
            Upload & delete media files
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-gray-300 text-gray-700 bg-transparent"
        >
          Open Archive
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-1">
          {/* Popular Content Header */}
          <h3 className="text-sm font-semibold text-gray-600 mb-4">
            Popular Content
          </h3>

          {/* Archive Items */}
          <div
            className={`transition-all duration-300 ${
              isExpanded ? "overflow-y-auto" : ""
            }`}
            style={{
              maxHeight: isExpanded ? "calc(100vh - 300px)" : "auto",
            }}
          >
            {archiveItems.slice(0, visibleCount).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 mt-4  bg-white  px-3 rounded hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600 truncate">
                      {item.title}
                    </p>
                    {item.hasIndicator && (
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{item.type}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-600">
                    {item.views}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* View More / View Less Button */}
          <button
            onClick={toggleView}
            className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
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
