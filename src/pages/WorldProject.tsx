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
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import LeafletMapSearch from "@/test/LeafletMapSearch";
import { useGetAllMediaQuery, } from "@/redux/features/Media/mediaApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

const CLIMATE_OPTIONS = ["ALPINE", "CONTINENTAL", "TROPICAL", "DESERT", "POLAR", "MARINE", "TEMPERATE"];
const CONTINENT_OPTIONS = ["ASIA", "EUROPE", "NORTH_AMERICA", "SOUTH_AMERICA", "AFRICA", "AUSTRALIA"];
const YEAR_OPTIONS = Array.from({ length: 31 }, (_, i) => 2000 + i); // 2000 to 2030

// Simple geocoding cache to avoid duplicate requests
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};
const geocodeLocation = async (locationStr: string): Promise<{ lat: number; lng: number } | null> => {
  if (geocodeCache[locationStr] !== undefined) return geocodeCache[locationStr];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[locationStr] = coords;
      return coords;
    }
  } catch (err) {
    console.error("Geocoding failed for:", locationStr, err);
  }
  geocodeCache[locationStr] = null;
  return null;
};

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
  const [climateFilter, setClimateFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, { lat: number; lng: number }>>({}); 

  const { data: apiData, isLoading, error: apiError } = useGetAllMediaQuery({ type: "WORLD_PROJECT" });

  if (apiError) console.error("Error fetching world projects:", apiError);

  // Geocode location strings when API data arrives
  useEffect(() => {
    if (!apiData?.data) return;
    const toGeocode = apiData.data.filter(
      (item: any) => !item.coordinates && item.location && !geocodedLocations[item.id]
    );
    if (toGeocode.length === 0) return;

    let cancelled = false;
    (async () => {
      const newLocations: Record<string, { lat: number; lng: number }> = {};
      for (const item of toGeocode) {
        if (cancelled) break;
        const coords = await geocodeLocation(item.location);
        if (coords) newLocations[item.id] = coords;
      }
      if (!cancelled && Object.keys(newLocations).length > 0) {
        setGeocodedLocations(prev => ({ ...prev, ...newLocations }));
      }
    })();
    return () => { cancelled = true; };
  }, [apiData]);

  const worldProjectsDynamic = apiData?.data?.map((item: any) => {
    // Resolve coordinates: prefer explicit coordinates, then geocoded result
    let resolvedLocation = null;
    if (item.coordinates) {
      resolvedLocation = typeof item.coordinates === 'string' ? JSON.parse(item.coordinates) : item.coordinates;
    } else if (geocodedLocations[item.id]) {
      resolvedLocation = geocodedLocations[item.id];
    }

    return {
      id: item.id,
      name: item.title,
      PublishedDate: item.publishDate ? new Date(item.publishDate).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString(),
      Architect: item.architect || "TBA",
      Photographer: item.photographer || "TBA",
      description: item.excerpt || item.content?.substring(0, 100) + "...",
      locationName: item.location || (item.city ? `${item.city}, ${item.country}` : "Global"),
      continent: item.continent || "",
      climate: item.climate || "",
      city: item.city || "",
      country: item.country || "",
      state: item.state || "",
      region: item.region || "",
      year: item.projectYear || 2024,
      tags: item.projectTags || [],
      images: item.assets?.map((a: any) => a.cdnUrl) || [],
      location: resolvedLocation,
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      projectYear: item.projectYear,
    };
  }) || [];



  // Get unique values for filters from dynamic data
  const availableTags = Array.from(new Set(worldProjectsDynamic.flatMap((p: any) => p.tags || []))) as string[];

  const hasActiveFilters = searchQuery || continentFilter || climateFilter || yearFilter || selectedTags.length > 0 || selectedLocation;
  const clearAllFilters = () => {
    setSearchQuery("");
    setContinentFilter("");
    setClimateFilter("");
    setYearFilter("");
    setSelectedTags([]);
    setSelectedLocation(null);
  };

  // Step 1: Search filter
  let filtered = worldProjectsDynamic.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Architect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Photographer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.locationName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.country || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.state || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.region || "").toLowerCase().includes(searchQuery.toLowerCase())
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

  // Step 4: Climate filter
  if (climateFilter) {
    filtered = filtered.filter((p: any) => p.climate === climateFilter);
  }

  // Step 5: Year filter
  if (yearFilter) {
    filtered = filtered.filter((p: any) => String(p.year) === yearFilter);
  }

  // Step 6: Location filter (if map location is selected)
  let displayedProjects = selectedLocation
    ? filtered.filter(
      (p: any) => p.location && getDistanceKm(p.location, selectedLocation) <= 200
    )
    : filtered;

  // const handleVote = async (projectId: string) => {
  //   try {
  //     await toggleLike(projectId).unwrap();
  //   } catch (err) {
  //     console.error("Failed to vote:", err);
  //   }
  // };

  // const onCommentSubmit = async (projectId: string, content: string) => {
  //   try {
  //     await addComment({ id: projectId, content }).unwrap();
  //   } catch (err) {
  //     console.error("Failed to add comment:", err);
  //   }
  // };

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
      <h1 className="text-xl font-bold flex justify-center w-full mt-5 text-center md:text-left">
        World Projects
      </h1>
      <div className="max-w-6xl mx-auto mt-10 md:px-0 px-4 pb-34">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">


          <div className="relative flex flex-col md:w-1/3 w-full">
            <div className="flex items-center gap-2 px-4 w-full border rounded-lg bg-white shadow-sm relative z-20">
              <Search className="text-gray-600" size={14} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none py-2 bg-transparent text-gray-700 text-sm"
              />
            </div>
            {searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {displayedProjects.length > 0 ? (
                  displayedProjects.map((project: any) => (
                    <div 
                      key={project.id} 
                      className="p-3 border-b hover:bg-gray-50 cursor-pointer flex gap-3"
                      onClick={() => navigate(`/world-project/${project.id}`)}
                    >
                      <img src={project.images[0] || "/placeholder.svg"} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1 text-sm">
                        <div className="font-bold flex justify-between">
                          <span>{project.name}</span>
                          <span className="text-gray-500 font-normal">{project.locationName}</span>
                        </div>
                        <div className="text-gray-600 flex justify-between text-xs mt-1">
                          <span>Architect: {project.Architect}</span>
                          <span>Year: {project.projectYear}</span>
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          Photographer: {project.Photographer}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No projects found</div>
                )}
              </div>
            )}
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
              onChange={(e) => setClimateFilter(e.target.value)}
              value={climateFilter}
            >
              <option value="">Climate</option>
              {CLIMATE_OPTIONS.map((climate: string) => (
                <option key={climate} value={climate}>{climate.replace(/_/g, " ")}</option>
              ))}
            </select>

            <select
              className="border rounded-lg px-3 py-1 text-sm bg-white"
              onChange={(e) => setContinentFilter(e.target.value)}
              value={continentFilter}
            >
              <option value="">All Continents</option>
              {CONTINENT_OPTIONS.map((continent: string) => (
                <option key={continent} value={continent}>{continent.replace(/_/g, " ")}</option>
              ))}
            </select>

            <select
              className="border rounded-lg px-3 py-1 text-sm bg-white"
              onChange={(e) => setYearFilter(e.target.value)}
              value={yearFilter}
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((year: number) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="border rounded-lg px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="py-6 mb-10">
          <LeafletMapSearch 
            onLocationSelect={setSelectedLocation} 
            projects={displayedProjects}
            onProjectClick={(id) => navigate(`/world-project/${id}`)}
          />
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.length === 0 ? (
            <div className="col-span-full flex justify-center items-center min-h-[50vh]">
              <h2>
                No projects found for this area.
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
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Architect:</span> {project.Architect}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Photographer:</span>  {project.Photographer}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Year:</span>  {project.projectYear}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Location:</span>  {project.locationName}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Description:</span> {project.description}
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

                  {/* <div className="mt-4">
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
                  </div> */}

                  {/* <div className="mt-2 space-y-2">
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
                  </div> */}
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
      <div className="mb-44 mt-12">
        <HeroSocialMedia />
      </div>
    </div>
  );
}

export default WorldProject;
