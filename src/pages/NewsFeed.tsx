import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import LatestNews from "@/components/newsFeed/LatestNews";
import preview1 from "@/assets/newsfeed/preview-1.jpg";
import preview2 from "@/assets/newsfeed/preview-2.jpg";
import preview3 from "@/assets/newsfeed/preview-3.jpg";
import article1 from "@/assets/newsfeed/newsfeed-1.jpg";
import { Link } from "react-router-dom";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

function NewsFeed() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: newsData, isLoading, error } = useGetAllMediaQuery({ type: "NEWS" });
  const { data: featuredData } = useGetAllMediaQuery({ featured: "true", limit: 3 });

  const newsItems = newsData?.data?.map((item: any) => ({
    id: item.id,
    title: item.title,
    date: item.publishDate ? new Date(item.publishDate).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString(),
    summary: item.excerpt || item.content?.substring(0, 150) + "...",
    image: item.coverImage || (item.assets && item.assets[0]?.cdnUrl) || article1,
    source: item.author || "Architecture Simple",
    photographer: item.photographer || "",
  })) || [];

  // Filter newsItems based on search term
  const filteredNews = newsItems.filter(
    (news: any) =>
      news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.photographer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featured = featuredData?.data?.[0];
  const featuredProject = featured ? {
    id: featured.id,
    name: featured.title,
    year: featured.projectYear || 2024,
    architect: featured.architect || "Architecture Simple",
    photographer: featured.photographer || "TBA",
    location: featured.location || (featured.city ? `${featured.city}, ${featured.country}` : "Global"),
    summary: featured.excerpt || featured.content?.substring(0, 300) + "...",
    images: featured.assets?.map((a: any) => a.cdnUrl) || [preview1, preview2, preview3],
  } : {
    id: 0,
    name: "Floating Pavilion",
    year: 2023,
    architect: "Zaha Hadid Architects",
    photographer: "Iwan Baan",
    location: "Rotterdam, Netherlands",
    summary:
      "A stunning waterfront structure that seamlessly blends with its environment...",
    images: [preview1, preview2, preview3],
  };

  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: {
      perView: 1,
      spacing: 15,
    },
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );
  if (error) return <p className="text-center py-20 text-red-500">Error loading news feed. Please try again later.</p>;
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
                    {featuredProject.images.map((image: string, index: number) => (
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

              <div className="md:w-1/2 flex flex-col ">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-card-foreground">
                    {featuredProject.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 text-muted-foreground mb-4">
                    <span>Year: {featuredProject.year}</span>
                    <span>Architect: {featuredProject.architect}</span>
                    <span>Photographer: {featuredProject.photographer}</span>
                    <span>Location: {featuredProject.location}</span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-4 text-gray-700  leading-relaxed">
                    {featuredProject.summary}
                  </p>
                </div>

                <div className="self-end mt-auto">
                  <Link
                    to={`/newsFeed/${featuredProject.id}`}
                    className="px-4 py-2  border border-border text-xs bg-background cursor-pointer hover:bg-accent text-gray-600 hover:text-accent-foreground rounded-md hover:text-white hover:bg-black  transition-colors"
                  >
                    View Project Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <LatestNews filteredNews={filteredNews} />
      </div>
      {/* footer  */}
      <div className="mb-32 mt-12">
        <HeroSocialMedia />
      </div>
    </div>
  );
}

export default NewsFeed;
