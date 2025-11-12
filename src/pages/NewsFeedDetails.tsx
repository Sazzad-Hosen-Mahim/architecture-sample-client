import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import preview1 from "@/assets/newsfeed/preview-1.jpg";
import article1 from "@/assets/newsfeed/newsfeed-1.jpg";
import article2 from "@/assets/newsfeed/newsfeed-2.jpg";
import article3 from "@/assets/newsfeed/newsfeed-3.jpg";
import article4 from "@/assets/newsfeed/newsfeed-4.jpg";
import article5 from "@/assets/newsfeed/newsfeed-5.jpg";

const NewsFeedDetails = () => {
  const { id } = useParams();

  // You can later fetch from backend, for now same mock list
  const newsItems = [
    {
      id: 0,
      title: "Floating Pavilion",
      date: "June 1, 2023",
      content:
        "A stunning waterfront structure that seamlessly blends with its environment, showcasing innovative use of sustainable materials and cutting-edge design techniques. This project of the month exemplifies the future of adaptive architecture, responding to both environmental and social needs of urban spaces.",
      image: preview1,
    },
    {
      id: 1,
      title: "Architecture Simple Wins Design Award",
      date: "June 15, 2023",
      summary:
        "Our eco-friendly office complex project receives recognition for innovative sustainable design. Our eco-friendly office complex project receives recognition for innovative sustainable design. Our eco-friendly office complex project receives recognition for innovative sustainable design.",
      image: article1,
      source: "Architectural Digest",
      content:
        "This award highlights our dedication to sustainable practices and innovation in modern architecture. The project uses green materials, solar panels, and optimized ventilation to reduce environmental impact while maintaining design excellence.",
    },
    {
      id: 2,
      title: "New Urban Planning Initiative Launched",
      date: "June 10, 2023",
      summary:
        "We're partnering with the city to develop a new community-focused urban renewal project.",
      image: article2,
      source: "CityLab",
      content:
        "The initiative focuses on reviving underdeveloped urban zones with sustainable planning, eco-friendly transport, and increased accessibility for residents.",
    },
    {
      id: 3,
      title: "Spotlight on Our Latest Residential Project",
      date: "June 5, 2023",
      summary:
        "Explore our modern approach to home design in our recently completed residential project.",
      image: article3,
      source: "Dwell Magazine",
      content:
        "Our residential project redefines modern living with open-space concepts, sustainable materials, and energy-efficient systems to promote both comfort and environmental responsibility.",
    },
    {
      id: 4,
      title: "Architecture Simple Expands Team",
      date: "May 28, 2023",
      summary:
        "We're excited to welcome new talent to our growing team of architects and designers.",
      image: article4,
      source: "Architect Magazine",
      content:
        "The expansion brings new expertise and creativity to the firm, enabling us to take on more diverse and ambitious architectural projects worldwide.",
    },
    {
      id: 5,
      title: "Upcoming Webinar: Future of Sustainable Architecture",
      date: "May 20, 2023",
      summary:
        "Join us for an insightful discussion on the future trends in sustainable architectural design.",
      image: article5,
      source: "ArchDaily",
      content:
        "Our experts will explore the challenges and opportunities of sustainable design, covering renewable materials, smart city planning, and zero-emission construction practices.",
    },
  ];

  const article = newsItems.find((item) => item.id === Number(id));

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 mb-16">
        <Link
          to="/newsFeed"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to News Feed
        </Link>
        <p className="text-gray-500">Article not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-24">
      <Link
        to="/newsFeed"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft size={16} />
        Back to News Feed
      </Link>

      <img
        src={article.image}
        alt={article.title}
        className="w-full h-80 object-cover rounded-xl mb-6"
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {article.date} · {article.source}
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">{article.summary}</p>
      <p className="text-gray-700 leading-relaxed">{article.content}</p>
    </div>
  );
};

export default NewsFeedDetails;
