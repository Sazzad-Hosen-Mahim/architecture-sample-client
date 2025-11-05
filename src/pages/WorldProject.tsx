import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { worldProjects } from "@/data/worldProjects";
import { ChevronLeft, ChevronRight, Search, Send } from "lucide-react";
import LeafletMapSearch from "@/test/LeafletMapSearch";

// Simple distance calculation between two coordinates (Haversine formula)
const getDistanceKm = (
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
) => {
  const R = 6371; // Earth radius km
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [votes, setVotes] = useState<{ [key: string]: number }>({});

  // First filter by search query globally (name or locationName)
  const filteredBySearch = worldProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.locationName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Then filter by distance if a location is selected
  const displayedProjects = selectedLocation
    ? filteredBySearch.filter(
        (p) =>
          p.location &&
          getDistanceKm(
            p.location as { lat: number; lng: number },
            selectedLocation
          ) <= 200
      )
    : filteredBySearch;

  // for vote
  const handleVote = (projectId: string) => {
    const key = `voted-${projectId}`;
    if (localStorage.getItem(key)) return; // already voted

    const newVotes = { ...votes, [projectId]: (votes[projectId] || 0) + 1 };
    setVotes(newVotes);
    localStorage.setItem("projectVotes", JSON.stringify(newVotes));
    localStorage.setItem(key, "true");
  };
  // for comment

  const [comments, setComments] = useState<{ [key: string]: string[] }>({});

  const handleAddComment = (projectId: string, comment: string) => {
    const existing = comments[projectId] || [];
    const updated = [...existing, comment];
    setComments({ ...comments, [projectId]: updated });

    localStorage.setItem(
      "projectComments",
      JSON.stringify({ ...comments, [projectId]: updated })
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem("projectComments");
    if (stored) {
      setComments(JSON.parse(stored));
    }
  }, []);

  return (
    <div>
      <div className="max-w-6xl mx-auto mt-10 md:px-0 px-4">
        {/* Header & search input */}
        <div className="flex flex-row justify-between mb-2">
          <h1 className="text-xl font-light">Featured Projects</h1>
          <div className="flex items-center gap-2 px-4 py-0 w-1/3 border rounded-lg  bg-white">
            <Search className="text-gray-600" size={14} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none py-2  bg-transparent text-gray-700 text-xs"
            />
          </div>
        </div>

        {/* Google Map search */}
        <div className="py-6 mb-10">
          <LeafletMapSearch onLocationSelect={setSelectedLocation} />
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.length === 0 ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <h2>No projects found for this area.</h2>
            </div>
          ) : (
            displayedProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer bg-white p-0 border-gray-300 overflow-hidden"
              >
                <Carousel className="w-full bg-black">
                  <CarouselContent>
                    {project.images.map((image, index) => (
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
                  <h2 className="text-sm font-bold">{project.name}</h2>
                  <p className="text-sm text-gray-500">
                    Photographer: {project.Photographer}
                  </p>
                  <p className="text-sm text-gray-500">
                    Description: {project.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    Location: {(project as any).locationName || "Unknown"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tags?.map((tag) => (
                      <button
                        key={tag}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {/* here vot and comment  */}
                  <div className="  mt-4">
                    <button
                      className="mr-4 text-xs px-6 py-1.5 border rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(project.id);
                      }}
                    >
                      👍 Vote ({votes[project.id] || 0})
                    </button>
                    <button
                      className=" text-xs px-6 py-1.5 border rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(project.id);
                      }}
                    >
                      👍 View Comments ({votes[project.id] || 0})
                    </button>
                  </div>

                  {/* ✅ Comments Section */}
                  <div className="mt-2 space-y-2">
                    <h4 className="text-sm font-semibold">Comments</h4>
                    <ul className="space-y-1 text-xs">
                      {(comments[project.id] || []).map((cmt, idx) => (
                        <li key={idx} className="bg-secondary p-2 rounded">
                          {cmt}
                        </li>
                      ))}
                    </ul>

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
                          handleAddComment(project.id, value);
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
                        className="p-2 text-white bg-black  rounded-full hover:bg-gray-700 cursor-pointer"
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

        {/* Pagination (optional) */}
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
