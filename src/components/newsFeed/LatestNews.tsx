/* eslint-disable @typescript-eslint/no-explicit-any */

import { useNavigate } from "react-router-dom";

function LatestNews({ filteredNews = [] }: { filteredNews?: any[] }) {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-2xl font-light mb-6">Latest News</h2>
      <div className="space-y-6">
        {filteredNews.map((news) => (
          <div
            key={news.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/newsFeed/${news.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/newsFeed/${news.id}`);
              }
            }}
            className="group border border-gray-200 rounded-lg shadow-sm bg-white cursor-pointer transition-all hover:border-gray-400 hover:shadow-md md:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image */}
                <div className="w-full md:w-40 md:shrink-0">
                  <img
                    src={news.image || "/placeholder.jpg"}
                    alt={news.title}
                    className="rounded-lg object-cover w-full h-40 md:h-full"
                  />
                </div>

                {/* Main content — kept clear of the meta column on the right */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold group-hover:underline">
                    {news.title}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold">Author:</span> {news.author}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="font-semibold">Photo Credits:</span>{" "}
                    {news.photographer || "N/A"}
                  </p>

                  <p className="text-gray-600 text-xs sm:text-sm mt-2 line-clamp-4">
                    <span className="font-semibold">Description:</span>{" "}
                    {news.summary}
                  </p>
                </div>

                {/* Meta column — dates top, publisher/source bottom */}
                <div className="w-full md:w-52 md:shrink-0 flex flex-col justify-between gap-4 text-xs text-gray-500 md:text-right md:border-l md:border-gray-100 md:pl-4">
                  <div className="space-y-0.5">
                    {news.uploadDate && (
                      <p>
                        <span className="font-semibold">Upload Date:</span>{" "}
                        {news.uploadDate}
                      </p>
                    )}
                    {news.publishedDate && (
                      <p>
                        <span className="font-semibold">Published date:</span>{" "}
                        {news.publishedDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p>
                      <span className="font-semibold">Publisher:</span>{" "}
                      {news.publisher || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Source:</span>{" "}
                      {news.sourceName || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredNews.length === 0 && (
          <p className="text-gray-500 text-sm">No news found.</p>
        )}
      </div>
    </div>
  );
}

export default LatestNews;
