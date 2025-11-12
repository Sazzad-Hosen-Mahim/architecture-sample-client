import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

interface Project {
  id: number;
  title: string;
  category: string;
  image: string[];
  year: number;
  description?: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Modern Residence",
    category: "Residential",
    description: "Historic Building ",
    image: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
    year: 2023,
  },
  {
    id: 2,
    title: "City Center Plaza",
    description: "Historic Building Renovation",
    category: "Urban Planning",
    image: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
    year: 2022,
  },
  {
    id: 3,
    title: "Eco-Friendly Office Complex",
    description: "Historic Building Renovation",
    category: "Commercial",
    image: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
    year: 2021,
  },
  {
    id: 4,
    title: "Historic Building Renovation",
    description: "Historic Building Renovation",
    category: "Restoration",
    image: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
    year: 2020,
  },
  {
    id: 5,
    title: "Sustainable Community Center",
    description: "Historic Building Renovation",
    category: "Public",
    image: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
    year: 2022,
  },
  {
    id: 6,
    title: "Luxury Hotel Design",
    description: "Historic Building Renovation",
    category: "Hospitality",
    image: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
    year: 2023,
  },
];

export default function Portfolio() {
  const [sortBy, setSortBy] = useState<"title" | "year">("title");
  const [filterBy, setFilterBy] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expanded] = useState<number | null>(null); // track expanded description per project

  const categories = useMemo(() => {
    return Array.from(new Set(projects.map((project) => project.category)));
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  console.log(handleCategoryChange);
  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Filter by dropdown filterBy (if set)
        if (
          filterBy &&
          project.category.toLowerCase() !== filterBy.toLowerCase()
        ) {
          return false;
        }
        // Filter by selected categories checkbox (if any selected)
        if (
          selectedCategories.length > 0 &&
          !selectedCategories.includes(project.category)
        ) {
          return false;
        }
        // Filter by search term in title or description (case insensitive)
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          const inTitle = project.title.toLowerCase().includes(lowerSearch);
          const inDescription = project.description
            ? project.description.toLowerCase().includes(lowerSearch)
            : false;
          if (!inTitle && !inDescription) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        } else {
          return b.year - a.year;
        }
      });
  }, [filterBy, searchTerm, selectedCategories, sortBy]);
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Our Portfolio</h1>

        {/* search filter, sort option  */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex px-4 py-1.5 rounded-md border-1 border-black overflow-hidden md:w-1/2 w-full ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 192.904 192.904"
              width="16px"
              className="fill-gray-700 mr-3 rotate-90"
            >
              <path d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z"></path>
            </svg>
            <input
              type="text" // change from email to text
              placeholder="Search Something....."
              className="w-full outline-none bg-transparent text-gray-600 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* sort by  year */}
          <div className="flex px-4 py-1.5 rounded-md gap-6  overflow-hidden ">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "title" | "year")}
              className="w-full outline-none bg-transparent border cursor-pointer py-1.5 px-6 rounded text-gray-600 text-sm"
            >
              <option value="title">Sort by Title</option>
              <option value="year">Sort by Year </option>
            </select>
            {/* ---------------  */}

            <div className="flex gap-4 w-full ">
              {/* Filter Dropdown */}
              <div className="relative md:w-1/4 w-full">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="w-full  bg-transparent border-black  appearance-none outline-none text-black border cursor-pointer py-1.5 px-6 pr-10 rounded text-sm"
                >
                  <option value="">Filter by Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-1 top-1/2 -translate-y-1/2 text-black w-4 h-4 pointer-events-none" />
              </div>
              {/* -------------------  */}
              {/* Optional: Checkbox category filter */}
              {/* <div className="mb-8 flex flex-wrap gap-4">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="inline-flex items-center cursor-pointer space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="cursor-pointer"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div> */}
            </div>
          </div>
          {/* filter by category */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-scroll ">
          {filteredAndSortedProjects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden py-0  border-gray-200"
            >
              {/* <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              /> */}
              <Carousel className="mb-4 relative">
                <CarouselContent>
                  {project.image.map((img, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`image-${index}`}
                        width={400}
                        height={300}
                        className="w-full h-[230px] rounded-lg object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer" />
              </Carousel>
              <CardContent className="p-4 ">
                <h2 className="text-sm font-semibold mb-2">{project.title}</h2>
                <p
                  className={`text-gray-600 mb-1 ${
                    expanded ? "" : "line-clamp-2"
                  }`}
                >
                  <strong></strong> {project.description}
                  <button
                    // onClick={() => setExpanded(!expanded)}
                    className="text-blue-500 text-sm ml-2 hover:underline"
                  >
                    {expanded ? "Read less" : "Read more"}...
                  </button>
                </p>

                <p className="text-sm text-gray-500 mb-2">{project.category}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Year: {project.year}
                </p>
                <div className=" ">
                  <div className="flex flex-col md:flex-row gap-4 justify-center w-full">
                    <button className="flex-1 px-6 py-1.5 text-xs border rounded shadow-sm hover:shadow-md transition cursor-pointer">
                      View Project
                    </button>

                    <button className="flex-1 px-6 py-1.5 text-xs border rounded shadow-sm hover:shadow-md transition cursor-pointer">
                      View Comments
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
