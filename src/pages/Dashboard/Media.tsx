import CreateNewMedia from "@/components/Deshboard/MediaComponet/CreateNewMedia";
import MediaArchive from "@/components/Deshboard/MediaComponet/MediaArchive";
import RecentActivity from "@/components/Deshboard/MediaComponet/RecentActivity";
import HomeMediaManager from "@/components/Deshboard/MediaComponet/HomeMediaManager";

export default function Media() {
  return (
    <div className=" ">
      <div className="max-w-8xl mx-auto px-10 ">
        <div className="bg-blue-50 border-blue-400  mt-4 p-3 rounded-xl ">
          <h2>Media Center</h2>
          <p className="text-xs text-gray-600">
            Create harmony in your digital presence
          </p>
        </div>
        <div className="flex flex-col gap-6 md:flex-row mt-6">
          {/* Left Column - Create New Media (40%) */}
          <div className="w-full md:w-2/5">
            <CreateNewMedia />
          </div>

          {/* Middle Column - Recent Activity (30%) */}
          <div className="w-full md:w-3/10 pb-6">
            <RecentActivity />
          </div>

          {/* Right Column - Media Archive (30%) */}
          <div className="w-full md:w-3/10 flex flex-col gap-6">
            <MediaArchive />
            <HomeMediaManager />
          </div>
        </div>
      </div>
    </div>
  );
}
