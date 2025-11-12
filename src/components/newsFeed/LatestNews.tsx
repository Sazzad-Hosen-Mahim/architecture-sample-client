/* eslint-disable @typescript-eslint/no-explicit-any */

import { Link } from "react-router-dom";

function LatestNews({ filteredNews = [] }: { filteredNews?: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-light mb-6">Latest News</h2>
      <div className="space-y-6">
        {filteredNews.map((news) => (
          <div
            key={news.id}
            className="border border-gray-200 rounded-lg shadow-sm bg-white"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Image */}
                <div className="w-full md:w-32">
                  <img
                    src={news.image || "/placeholder.jpg"}
                    alt={news.title}
                    className="rounded-lg object-cover w-full h-40 md:h-32"
                  />
                </div>

                {/* Text content */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                    <h2 className="text-sm sm:text-base font-semibold">
                      {news.title}
                    </h2>
                    <span className="font-bold text-sm text-gray-500 mt-1 md:mt-0">
                      Published date: {news.date}
                    </span>
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 md:w-[70%]">
                    {news.summary}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Link
                      to={`/newsFeed/${news.id}`}
                      className="px-3 sm:px-4 py-2 border border-gray-800 rounded-md text-xs sm:text-sm hover:text-white hover:bg-black text-gray-700 bg-white cursor-pointer focus:outline-none text-center"
                    >
                      Read Full Article
                    </Link>
                    <span className="text-xs sm:text-sm text-gray-500">
                      Author: {news.source}
                    </span>
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
