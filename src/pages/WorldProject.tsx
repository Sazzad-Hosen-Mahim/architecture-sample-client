import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Search, Send, SlidersHorizontal } from "lucide-react";
import LeafletMapSearch from "@/test/LeafletMapSearch";
import { useGetAllMediaQuery, useToggleLikeMutation, useCreateCommentMutation } from "@/redux/features/Media/mediaApi";

// Simple distance calculation between two coordinates (Haversine formula)
const getDistanceKm = (
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
) => {
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((loc1.lat * Math.PI) / 180) *
    Math.cos((loc2.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function WorldProject() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [continentFilter, setContinentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"all" | "top-rated">("all");

  const { data: apiData, isLoading, error: apiError } = useGetAllMediaQuery({ type: "WORLD_PROJECT" });
  const [toggleLike] = useToggleLikeMutation();
  const [addComment] = useCreateCommentMutation();

  if (apiError) console.error("Error fetching world projects:", apiError);

  const worldProjectsDynamic = apiData?.data?.map((item: any) => ({
    id: item.id,
    name: item.title,
    PublishedDate: item.publishDate ? new Date(item.publishDate).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString(),
    Architect: item.architect || "TBA",
    Photographer: item.photographer || "TBA",
    description: item.excerpt || item.content?.substring(0, 100) + "...",
    locationName: item.location || (item.city ? `${item.city}, ${item.country}` : "Global"),
    continent: item.country?.includes("USA") ? "North America" : "Global", // Simplified mapping
    year: item.projectYear || 2024,
    tags: item.projectTags || [],
    images: item.assets?.map((a: any) => a.cdnUrl) || [],
    location: item.coordinates ? (typeof item.coordinates === 'string' ? JSON.parse(item.coordinates) : item.coordinates) : null,
    likeCount: item.likeCount || 0,
    commentCount: item.commentCount || 0,
  })) || [];

  // Import mock projects for the map pins (as requested: "previous pin")
  const mockProjectsForMap = [
    { id: "m1", name: "Tropical Villa", locationName: "Phuket", location: { lat: 7.8804, lng: 98.3923 } },
    { id: "m2", name: "Desert House", locationName: "Dubai", location: { lat: 25.1972, lng: 55.2744 } },
    { id: "m3", name: "Modern Office", locationName: "New York", location: { lat: 40.7128, lng: -74.0060 } },
    { id: "m4", name: "Sky Skyscraper", locationName: "Tokyo", location: { lat: 35.6762, lng: 139.6503 } },
  ];

  const mapProjects = [...worldProjectsDynamic, ...mockProjectsForMap];

  // Get unique values for filters from dynamic data
  const availableTags = Array.from(new Set(worldProjectsDynamic.flatMap((p: any) => p.tags || []))) as string[];
  const availableContinents = Array.from(new Set(worldProjectsDynamic.map((p: any) => p.continent))) as string[];
  const availableYears = Array.from(new Set(worldProjectsDynamic.map((p: any) => p.year))) as number[];

  // Step 1: Search filter
  let filtered = worldProjectsDynamic.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.locationName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Step 2: Tag filter
  if (selectedTags.length > 0) {
    filtered = filtered.filter((p: any) =>
      p.tags?.some((tag: string) => selectedTags.includes(tag))
    );
  }

  // Step 3: Continent filter
  if (continentFilter) {
    filtered = filtered.filter((p: any) => p.continent === continentFilter);
  }

  // Step 4: Year filter
  if (yearFilter) {
    filtered = filtered.filter((p: any) => String(p.year) === yearFilter);
  }

  // Step 5: Location filter (if map location is selected)
  let displayedProjects = selectedLocation
    ? filtered.filter(
      (p: any) => p.location && getDistanceKm(p.location, selectedLocation) <= 200
    )
    : filtered;

  // Step 6: Apply tab filter - sort by real likes for top-rated
  if (activeTab === "top-rated") {
    displayedProjects = [...displayedProjects].sort((a: any, b: any) => b.likeCount - a.likeCount);
  }

  const handleVote = async (projectId: string) => {
    try {
      await toggleLike(projectId).unwrap();
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const onCommentSubmit = async (projectId: string, content: string) => {
    try {
      await addComment({ id: projectId, content }).unwrap();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const popup = document.getElementById("tag-popup");
      if (popup && !popup.contains(e.target as Node)) {
        setShowTagPopup(false);
      }
    };
    if (showTagPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagPopup]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div>
      <div className="max-w-6xl mx-auto mt-10 md:px-0 px-4 pb-34">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-xl font-bold md:w-1/4 text-center md:text-left">
            World Projects
          </h1>

          <div className="flex items-center justify-center md:w-1/3 w-full">
            <div className="flex items-center gap-2 px-4 w-full border rounded-lg bg-white shadow-sm">
              <Search className="text-gray-600" size={14} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none py-2 bg-transparent text-gray-700 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-end gap-2 md:w-1/3">
            <div className="relative">
              <button
                onClick={() => setShowTagPopup(!showTagPopup)}
                className="border rounded-lg px-3 py-2 bg-white flex items-center gap-2"
              >
                <SlidersHorizontal size={16} />
                Tags
              </button>

              {showTagPopup && (
                <div
                  id="tag-popup"
                  className="absolute top-full mt-2 right-0 w-56 bg-white shadow-lg border rounded-lg p-4 z-50"
                >
                  <h3 className="text-sm font-semibold mb-2">Filter by Tags</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableTags.map((tag: string) => (
                      <label
                        key={tag}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(
                                selectedTags.filter((t: string) => t !== tag)
                              );
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs px-3 py-1 border rounded"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowTagPopup(false)}
                      className="text-xs px-3 py-1 bg-black text-white rounded"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <select
              className="border rounded-lg px-3 py-1 text-sm bg-white"
              onChange={(e) => setContinentFilter(e.target.value)}
              value={continentFilter}
            >
              <option value="">All Continents</option>
              {availableContinents.map(
                (continent: string) => (
                  <option key={continent} value={continent}>
                    {continent}
                  </option>
                )
              )}
            </select>

            <select
              className="border rounded-lg px-3 py-1 text-sm bg-white"
              onChange={(e) => setYearFilter(e.target.value)}
              value={yearFilter}
            >
              <option value="">All Years</option>
              {availableYears.map(
                (year: number) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="py-6 mb-10">
          <LeafletMapSearch onLocationSelect={setSelectedLocation} projects={mapProjects} />
        </div>

        {/* Tab Component */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "all"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab("top-rated")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "top-rated"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Top Rated Projects
          </button>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.length === 0 ? (
            <div className="col-span-full flex justify-center items-center min-h-[50vh]">
              <h2>
                {activeTab === "top-rated"
                  ? "No voted projects yet."
                  : "No projects found for this area."}
              </h2>
            </div>
          ) : (
            displayedProjects.map((project: any) => (
              <Card
                key={project.id}
                className="cursor-pointer bg-white p-0 border-gray-300 overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/world-project/${project.id}`)}
              >
                <Carousel className="w-full bg-black">
                  <CarouselContent>
                    {project.images.map((image: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="h-56 w-full overflow-hidden">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`image-${index}`}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer" />
                </Carousel>

                <CardContent className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-bold">{project.name}</h2>
                    <p className="text-xs text-gray-500">
                      Published: {project.PublishedDate}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-500">
                    Architect: {project.Architect}
                  </p>
                  <p className="text-sm text-gray-500">
                    Photographer: {project.Photographer}
                  </p>
                  <p className="text-sm text-gray-500">
                    Description: {project.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    Location: {project.locationName || "Unknown"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tags?.map((tag: string) => (
                      <button
                        key={tag}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      className="mr-4 text-xs px-6 py-1.5 border rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(project.id);
                      }}
                    >
                      Vote ({project.likeCount})
                    </button>
                    <button
                      className="text-xs px-6 py-1.5 border rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/world-project/${project.id}`);
                      }}
                    >
                      View Comments ({project.commentCount})
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    <form
                      onClick={(e) => e.stopPropagation()}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem(
                          "comment"
                        ) as HTMLInputElement;
                        const value = input.value.trim();
                        if (value) {
                          onCommentSubmit(project.id, value);
                          input.value = "";
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="comment"
                        placeholder="Add a comment..."
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                      <button
                        type="submit"
                        className="p-2 text-white bg-black rounded-full hover:bg-gray-700 cursor-pointer"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-2 mt-10">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">Page s</span>
          <Button variant="outline" size="sm">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WorldProject;
