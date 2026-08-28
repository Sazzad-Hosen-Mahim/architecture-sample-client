import { useParams } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";
import article1 from "@/assets/newsfeed/newsfeed-1.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

  // All uploaded images, in order; fall back to the cover image / placeholder.
  const images: string[] = (
    article.assets?.map((a: any) => a.cdnUrl).filter(Boolean) ?? []
  ) as string[];
  if (images.length === 0) {
    images.push(article.coverImage || article1);
  }

  const publishedDate = article.publishDate
    ? new Date(article.publishDate).toLocaleDateString()
    : "";
  const uploadDate = article.uploadDate
    ? new Date(article.uploadDate).toLocaleDateString()
    : article.createdAt
      ? new Date(article.createdAt).toLocaleDateString()
      : "";
  const displayAuthor = article.author || "Architecture Simple";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-24">
      {/* <Link
        to="/newsFeed"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft size={16} />
        Back to News Feed
      </Link> */}

      {images.length > 1 ? (
        <Carousel opts={{ loop: true }} className="mb-6">
          <CarouselContent>
            {images.map((src, index) => (
              <CarouselItem key={index}>
                <img
                  src={src}
                  alt={`${article.title} — image ${index + 1}`}
                  className="w-full h-80 object-cover rounded-xl"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 z-10" />
          <CarouselNext className="right-4 z-10" />
        </Carousel>
      ) : (
        <img
          src={images[0]}
          alt={article.title}
          className="w-full h-80 object-cover rounded-xl mb-6"
        />
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
      <p className="text-sm text-gray-600 mb-1">
        By {displayAuthor}
        {article.publisher ? ` · ${article.publisher}` : ""}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        {publishedDate ? `Published ${publishedDate}` : ""}
        {uploadDate ? ` · Uploaded ${uploadDate}` : ""}
        {article.source ? ` · Source: ${article.source}` : ""}
        {article.photographer ? ` · Photo credits: ${article.photographer}` : ""}
      </p>
      {article.excerpt ? (
        <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
          {article.excerpt}
        </p>
      ) : null}
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {article.content}
      </p>
    </div>
  );
};

export default NewsFeedDetails;
