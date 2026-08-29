/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

const PAGE_SIZE = 9;

// "RESIDENTIAL" -> "Residential", "MIXED_USE" -> "Mixed Use"
const toTitleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Portfolio() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data: apiData, isLoading } = useGetAllMediaQuery({
    type: "PORTFOLIO",
  });

  const projects = useMemo(() => {
    return (
      apiData?.data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category || "",
        description: item.excerpt || item.content?.substring(0, 100) + "...",
        image: item.assets?.map((a: any) => a.cdnUrl) || [],
        year: item.projectYear || 2024,
        timestamp: new Date(item.publishDate || item.createdAt).getTime(),
        PublishedDate: item.publishDate
          ? new Date(item.publishDate).toLocaleDateString()
          : new Date(item.createdAt).toLocaleDateString(),
        Photographer: item.photographer || "TBA",
      })) || []
    );
  }, [apiData]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((project: any) => project.category)
          .filter((c: string) => Boolean(c)),
      ),
    ) as string[];
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

  // Shown as a badge on the funnel so applied filters are visible when it's closed.
  const activeFilterCount = (filterBy ? 1 : 0) + (yearFilter ? 1 : 0);

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
        switch (sortBy) {
          case "oldest":
            return a.timestamp - b.timestamp;
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          case "newest":
          default:
            return b.timestamp - a.timestamp;
        }
      });
  }, [filterBy, yearFilter, searchTerm, sortBy, projects]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [filterBy, yearFilter, searchTerm, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedProjects.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pageProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );

  return (
    <div>
      <div className="max-w-6xl mx-auto mt-2 md:px-0 px-4 pb-34">
        {/* Header & Filters */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
          {/* Search + funnel + clear — one line on every screen. On desktop the
              funnel + clear are pushed to the end, right before the title. */}
          <div className="flex items-center gap-2 flex-1 min-w-0 order-2 md:order-1">
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-2 px-3 w-full border border-gray-400 rounded-lg bg-white shadow-sm">
                <Search className="text-gray-600 shrink-0" size={14} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-0 outline-none py-2 bg-transparent text-gray-700 text-sm"
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
                              {project.category
                                ? toTitleCase(project.category)
                                : ""}
                            </span>
                          </div>
                          <div className="text-gray-600 flex justify-between text-xs mt-1">
                            <span>Photographer: {project.Photographer}</span>
                            <span>Year: {project.year}</span>
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

            {/* Filters funnel — every sort / filter control lives in here */}
          </div>

          <h1 className="text-xl w-full md:w-1/3 md:shrink-0 flex justify-center text-center order-1 md:order-2">
            Portfolio
          </h1>

          {/* Balances the search side so the title stays centred on desktop */}
          <div className="flex justify-end items-center gap-2 w-auto md:w-1/3 order-3">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Filters"
                    title="Filters"
                    className="relative cursor-pointer shrink-0 border border-gray-400 rounded-lg p-2 bg-white flex items-center hover:bg-gray-50"
                  >
                    <Filter size={16} />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-300 p-4 space-y-3"
                >
                  <h3 className="text-sm font-semibold">Sort &amp; Filter</h3>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Sort by
                    </span>
                    <select
                      className="mt-1 w-full border border-gray-400 rounded-lg px-2 py-1.5 text-sm bg-white"
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      value={sortBy}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="title-asc">Project Title: A–Z</option>
                      <option value="title-desc">Project Title: Z–A</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Project Type
                    </span>
                    <select
                      className="mt-1 w-full border border-gray-400 rounded-lg px-2 py-1.5 text-sm bg-white"
                      onChange={(e) => setFilterBy(e.target.value)}
                      value={filterBy}
                    >
                      <option value="">All Categories</option>
                      {categories.map((category: string) => (
                        <option key={category} value={category.toLowerCase()}>
                          {toTitleCase(category)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Year
                    </span>
                    <select
                      className="mt-1 w-full border border-gray-400 rounded-lg px-2 py-1.5 text-sm bg-white"
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
                  </label>
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear — always beside the funnel, never inside it */}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              aria-label="Clear all filters"
              title="Clear all filters"
              className="shrink-0 cursor-pointer border border-gray-400 rounded-lg p-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mt-5 text-gray-400">
          <hr />
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          {pageProjects.length === 0 ? (
            <div className="col-span-full flex justify-center items-center min-h-[50vh]">
              <h2>No projects found.</h2>
            </div>
          ) : (
            pageProjects.map((project: any) => (
              <Card
                key={project.id}
                className="cursor-pointer bg-white p-0 border-gray-300 overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/world-project/${project.id}`)}
              >
                <Carousel className="w-full bg-black">
                  <CarouselContent>
                    {(project.image.length > 0
                      ? project.image
                      : ["/placeholder.svg"]
                    ).map((img: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="h-56 w-full overflow-hidden">
                          <img
                            src={img || "/placeholder.svg"}
                            alt={`${project.title} image ${index + 1}`}
                            className="w-full h-full rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/*
                    Each arrow sits in a positioned hit-zone that swallows the
                    click so it never reaches the card's navigate handler.
                  */}
                  <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CarouselPrevious className="static translate-y-0 cursor-pointer" />
                  </div>
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CarouselNext className="static translate-y-0 cursor-pointer" />
                  </div>
                </Carousel>

                <CardContent className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-bold">{project.title}</h2>
                    <p className="text-xs text-gray-500">
                      Published: {project.PublishedDate}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Photographer:</span>{" "}
                    {project.Photographer}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Year:</span> {project.year}
                  </p>
                  {project.category && (
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Project Type:</span>{" "}
                      {toTitleCase(project.category)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Description:</span>{" "}
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="mb-38 mt-12">
        <HeroSocialMedia />
      </div>
    </div>
  );
}
