import CreateNewMedia from "@/components/Deshboard/MediaComponet/CreateNewMedia";
import MediaArchive from "@/components/Deshboard/MediaComponet/MediaArchive";
import RecentActivity from "@/components/Deshboard/MediaComponet/RecentActivity";
import HomeMediaManager from "@/components/Deshboard/MediaComponet/HomeMediaManager";
import { useCanEdit } from "@/hooks/useDashboardAccess";

export default function Media() {
  const canEdit = useCanEdit();

  return (
    <div className=" ">
      <div className="max-w-8xl mx-auto px-4 sm:px-10">
        <div className="bg-blue-50 border-blue-400  mt-4 p-3 rounded-xl ">
          <h2>Media Center</h2>
          <p className="text-xs text-gray-600">
            Create harmony in your digital presence
          </p>
        </div>
        {/* The upload panel is dropped for view-only accounts, and the two
            remaining columns widen to fill the row rather than leaving a gap
            where it used to sit. */}
        <div
          className={`grid grid-cols-1 gap-6 mt-6 ${
            canEdit ? "md:grid-cols-2 lg:grid-cols-3" : "lg:grid-cols-2"
          }`}
        >
          {canEdit && (
            <div className="w-full">
              <CreateNewMedia />
            </div>
          )}

          {/* Recent Activity */}
          <div className="w-full pb-6">
            <RecentActivity />
          </div>

          {/* Media Archive */}
          <div className="w-full flex flex-col gap-6">
            <MediaArchive />
            <HomeMediaManager />
          </div>
        </div>
      </div>
    </div>
  );
}
