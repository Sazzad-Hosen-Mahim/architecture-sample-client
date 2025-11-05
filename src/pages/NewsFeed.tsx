import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import LatestNews from "@/components/newsFeed/LatestNews";

function NewsFeed() {
  const [searchTerm, setSearchTerm] = useState("");
  const newsItems = [
    {
      id: 1,
      title: "Architecture Simple Wins Design Award",
      date: "June 15, 2023",
      summary:
        "Our eco-friendly office complex project receives recognition for innovative sustainable design.Our eco-friendly office complex project receives recognition for innovative sustainable design.Our eco-friendly office complex project receives recognition for innovative sustainable design.",
      image:
        "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      source: "Architectural Digest",
    },
    {
      id: 2,
      title: "New Urban Planning Initiative Launched",
      date: "June 10, 2023",
      summary:
        "We're partnering with the city to develop a new community-focused urban renewal project.",
      image:
        "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      source: "CityLab",
    },
    {
      id: 3,
      title: "Spotlight on Our Latest Residential Project",
      date: "June 5, 2023",
      summary:
        "Explore our modern approach to home design in our recently completed residential project.",
      image:
        "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      source: "Dwell Magazine",
    },
    {
      id: 4,
      title: "Architecture Simple Expands Team",
      date: "May 28, 2023",
      summary:
        "We're excited to welcome new talent to our growing team of architects and designers.",
      image:
        "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      source: "Architect Magazine",
    },
    {
      id: 5,
      title: "Upcoming Webinar: Future of Sustainable Architecture",
      date: "May 20, 2023",
      summary:
        "Join us for an insightful discussion on the future trends in sustainable architectural design.",
      image:
        "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      source: "ArchDaily",
    },
  ];

  // const { data, error, isLoading } = useGetAllMediaQuery(undefined);
  // console.log(data);

  // if (isLoading) return <p>Loading...</p>;
  // if (error) return <p>Error loading media</p>;

  // Filter newsItems based on search term
  const filteredNews = newsItems.filter(
    (news) =>
      news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredProject = {
    id: 1,
    name: "Floating Pavilion",
    year: 2023,
    architect: "Zaha Hadid Architects",
    photographer: "Iwan Baan",
    location: "Rotterdam, Netherlands",
    summary:
      "A stunning waterfront structure that seamlessly blends with its environment, showcasing innovative use of sustainable materials and cutting-edge design techniques. This project of the month exemplifies the future of adaptive architecture, responding to both environmental and social needs of urban spaces.",
    images: [
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
      "https://res.cloudinary.com/dy0b6hvog/image/upload/v1755015665/istockphoto-2179523209-2048x2048_a6ytef.jpg",
    ],
  };
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: {
      perView: 1,
      spacing: 15,
    },
  });
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        {/* search bar  */}
        <div className="flex items-center px-4 py-3 rounded-md border-2 border-gray-200 overflow-hidden w-full">
          <Search className="text-black mr-3 rotate-90" size={16} />
          <input
            type="text"
            placeholder="Search media..."
            className="w-full outline-none bg-transparent text-black placeholder-gray-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* slider start here  */}
      <div className=" bg-background ">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card  rounded-lg shadow-sm mb-12 p-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <div className=" relative">
                  <div
                    ref={sliderRef}
                    className="keen-slider rounded-lg overflow-hidden p-1"
                  >
                    {featuredProject.images.map((image, index) => (
                      <div key={index} className="keen-slider__slide ">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`${featuredProject.name} - Image ${index + 1}`}
                          width={400}
                          height={300}
                          className="w-full h-56 object-cover rounded-xl "
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => instanceRef.current?.prev()}
                    className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-colors"
                    aria-label="Previous image"
                  >
                    <ArrowLeft />
                  </button>

                  <button
                    onClick={() => instanceRef.current?.next()}
                    className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-colors"
                    aria-label="Next image"
                  >
                    <ArrowRight />
                  </button>
                </div>
              </div>

              <div className="md:w-1/2">
                <h3 className="text-sm font-semibold mb-2 text-card-foreground">
                  {featuredProject.name}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 text-muted-foreground mb-4">
                  <span>Year: {featuredProject.year}</span>
                  <span>Architect: {featuredProject.architect}</span>
                  <span>Photo: {featuredProject.photographer}</span>
                  <span>Location: {featuredProject.location}</span>
                </div>
                <p className="text-muted-foreground text-xs mb-4 text-gray-700  leading-relaxed">
                  {featuredProject.summary}
                </p>

                <button className="px-4 py-2 border border-border text-xs bg-background cursor-pointer hover:bg-accent text-gray-600 hover:text-accent-foreground rounded-md hover:text-white hover:bg-black  transition-colors">
                  View Project Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <LatestNews filteredNews={filteredNews} />
      </div>
    </div>
  );
}

export default NewsFeed;
