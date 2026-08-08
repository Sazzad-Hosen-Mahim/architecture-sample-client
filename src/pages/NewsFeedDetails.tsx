import { useParams } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";
import article1 from "@/assets/newsfeed/newsfeed-1.jpg";
import { useGetMediaByIdOrSlugQuery } from "@/redux/features/Media/mediaApi";

const NewsFeedDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading, error } = useGetMediaByIdOrSlugQuery(id || "");

  const article = response?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!article || error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 mb-16">
        {/* <Link
          to="/newsFeed"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to News Feed
        </Link> */}
        <p className="text-gray-500">
          {error ? (error as any)?.data?.message || "Error loading article." : "Article not found."}
        </p>
      </div>
    );
  }

  const displayImage = article.coverImage || (article.assets && article.assets[0]?.cdnUrl) || article1;
  const displayDate = article.publishDate ? new Date(article.publishDate).toLocaleDateString() : new Date(article.createdAt).toLocaleDateString();
  const displaySource = article.author || "Architecture Simple";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-24">
      {/* <Link
        to="/newsFeed"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft size={16} />
        Back to News Feed
      </Link> */}

      <img
        src={displayImage}
        alt={article.title}
        className="w-full h-80 object-cover rounded-xl mb-6"
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {displayDate} · {displaySource}
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">{article.excerpt}</p>
      <p className="text-gray-700 leading-relaxed">{article.content}</p>
    </div>
  );
};

export default NewsFeedDetails;
