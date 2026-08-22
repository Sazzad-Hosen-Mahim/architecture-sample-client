/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

export default function Portfolio() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"title" | "year">("title");
  const [filterBy, setFilterBy] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: apiData, isLoading } = useGetAllMediaQuery({
    type: "PORTFOLIO",
  });

  const projects = useMemo(() => {
    return (
      apiData?.data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category || "Uncategorized",
        description: item.excerpt || item.content?.substring(0, 100) + "...",
        image: item.assets?.map((a: any) => a.cdnUrl) || [],
        year: item.projectYear || 2024,
        PublishedDate: item.publishDate
          ? new Date(item.publishDate).toLocaleDateString()
          : new Date(item.createdAt).toLocaleDateString(),
        Architect: item.architect || "TBA",
        Photographer: item.photographer || "TBA",
      })) || []
    );
  }, [apiData]);

  const categories = useMemo(() => {
    return Array.from(new Set(projects.map((project: any) => project.category)));
  }, [projects]);

  // Only offer years that actually have projects — newest first.
  const availableYears = useMemo(() => {
    return (
      Array.from(
        new Set(
          projects
            .map((project: any) => project.year)
            .filter((year: any) => Boolean(year)),
        ),
      ) as number[]
    ).sort((a, b) => b - a);
  }, [projects]);

  const hasActiveFilters = searchTerm || filterBy || yearFilter;
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterBy("");
    setYearFilter("");
  };

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter((project: any) => {
        if (
          filterBy &&
          project.category.toLowerCase() !== filterBy.toLowerCase()
        ) {
          return false;
        }

        if (yearFilter && String(project.year) !== yearFilter) {
          return false;
        }

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          const inTitle = project.title.toLowerCase().includes(lowerSearch);
          const inDescription = project.description
            ? project.description.toLowerCase().includes(lowerSearch)
            : false;
          const inCategory = project.category
            .toLowerCase()
            .includes(lowerSearch);
          if (!inTitle && !inDescription && !inCategory) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        } else {
          return b.year - a.year;
        }
      });
  }, [filterBy, yearFilter, searchTerm, sortBy, projects]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );

  return (
    <div>
      <div className="max-w-6xl mx-auto mt-10 md:px-0 px-4 pb-34">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex flex-col md:w-1/3 w-full">
            <div className="flex items-center gap-2 px-4 w-full border border-gray-400 rounded-lg bg-white shadow-sm relative z-20">
              <Search className="text-gray-600" size={14} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none py-2 bg-transparent text-gray-700 text-sm"
              />
            </div>
            {searchTerm.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {filteredAndSortedProjects.length > 0 ? (
                  filteredAndSortedProjects.map((project: any) => (
                    <div
                      key={project.id}
                      className="p-3 border-b hover:bg-gray-50 cursor-pointer flex gap-3"
                      onClick={() => navigate(`/world-project/${project.id}`)}
                    >
                      <img
                        src={project.image[0] || "/placeholder.svg"}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-bold flex justify-between">
                          <span>{project.title}</span>
                          <span className="text-gray-500 font-normal">
                            {project.category}
                          </span>
                        </div>
                        <div className="text-gray-600 flex justify-between text-xs mt-1">
                          <span>Architect: {project.Architect}</span>
                          <span>Year: {project.year}</span>
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          Photographer: {project.Photographer}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No projects found
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="text-xl w-1/3 flex justify-center text-center">
            Portfolio
          </h1>

          <div className="flex flex-wrap w-1/3 md:flex-nowrap justify-center md:justify-end gap-2 md:w-1/3">
            <select
              className="border border-gray-400 rounded-lg px-1 py-1 text-sm bg-white"
              onChange={(e) => setSortBy(e.target.value as "title" | "year")}
              value={sortBy}
            >
              <option value="title">Sort by Title</option>
              <option value="year">Sort by Year</option>
            </select>

            <select
              className="border border-gray-400 rounded-lg px-1 py-1 text-sm bg-white"
              onChange={(e) => setFilterBy(e.target.value)}
              value={filterBy}
            >
              <option value="">All Categories</option>
              {categories.map((category: any) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-400 rounded-lg px-1 py-1 text-sm bg-white"
              onChange={(e) => setYearFilter(e.target.value)}
              value={yearFilter}
            >
              <option value="">All Years</option>
              {availableYears.map((year: number) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="border border-gray-400 rounded-lg px-1 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 text-gray-400">
          <hr />
        </div>

        {/* Projects grid — same card as World Projects, minus the map above it */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {filteredAndSortedProjects.length === 0 ? (
            <div className="col-span-full flex justify-center items-center min-h-[50vh]">
              <h2>No projects found.</h2>
            </div>
          ) : (
            filteredAndSortedProjects.map((project: any) => (
              <Card
                key={project.id}
                className="cursor-pointer bg-white p-0 border-gray-300 overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/world-project/${project.id}`)}
              >
                <Carousel className="w-full bg-black">
                  <CarouselContent>
                    {project.image.map((img: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="h-56 w-full overflow-hidden">
                          <img
                            src={img || "/placeholder.svg"}
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
                    <h2 className="text-sm font-bold">{project.title}</h2>
                    <p className="text-xs text-gray-500">
                      Published: {project.PublishedDate}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Architect:</span>{" "}
                    {project.Architect}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Photographer:</span>{" "}
                    {project.Photographer}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Year:</span> {project.year}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Category:</span>{" "}
                    {project.category}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Description:</span>{" "}
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <div className="mb-38 mt-12">
        <HeroSocialMedia />
      </div>
    </div>
  );
}
