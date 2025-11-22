import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { worldProjects } from "@/data/worldProjects";
import {
  ArrowLeft,
  Send,
  MapPin,
  Calendar,
  User,
  Camera,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function WorldProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [votes, setVotes] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{
    [key: string]: { text: string; date: string; author: string }[];
  }>({});
  const [newComment, setNewComment] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const project = worldProjects.find((p) => p.id === id);

  useEffect(() => {
    const storedVotes = localStorage.getItem("projectVotes");
    if (storedVotes) setVotes(JSON.parse(storedVotes));

    const storedComments = localStorage.getItem("projectCommentsDetailed");
    if (storedComments) setComments(JSON.parse(storedComments));
  }, []);

  const handleVote = () => {
    if (!project) return;
    const key = `voted-${project.id}`;
    if (localStorage.getItem(key)) return;

    const newVotes = { ...votes, [project.id]: (votes[project.id] || 0) + 1 };
    setVotes(newVotes);
    localStorage.setItem("projectVotes", JSON.stringify(newVotes));
    localStorage.setItem(key, "true");
  };

  const handleAddComment = () => {
    if (!project || !newComment.trim()) return;

    const comment = {
      text: newComment.trim(),
      date: new Date().toLocaleDateString(),
      author: "Anonymous User",
    };

    const existing = comments[project.id] || [];
    const updated = [...existing, comment];
    const newComments = { ...comments, [project.id]: updated };

    setComments(newComments);
    localStorage.setItem(
      "projectCommentsDetailed",
      JSON.stringify(newComments)
    );
    setNewComment("");
  };

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-xl font-semibold mb-4">Project not found</h2>
          <Button onClick={() => navigate("/world-project")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const projectComments = comments[project.id] || [];

  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 pb-20">
      {/* Back Button */}
      <button
        onClick={() => navigate("/world-project")}
        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Projects</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Section */}
        <div className="flex-1 lg:w-2/3">
          {/* Project Title & Meta */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {project.name}
            </h1>
            <p className="text-gray-500 text-sm">
              Published: {project.PublishedDate}
            </p>
          </div>

          {/* Main Image Gallery */}
          <div className="mb-6">
            <div className="w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden mb-4">
              <img
                src={project.images[selectedImage] || "/placeholder.svg"}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            {project.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {project.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-black"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`thumb-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vote Button */}
          <div className="mb-6">
            <button
              onClick={handleVote}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Heart size={18} />
              <span>Vote ({votes[project.id] || 0})</span>
            </button>
          </div>

          {/* Project Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Architect</p>
                  <p className="text-sm font-medium">{project.Architect}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Camera size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Photographer</p>
                  <p className="text-sm font-medium">{project.Photographer}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium">
                    {project.locationName}, {project.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Calendar size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="text-sm font-medium">{project.year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Continent</p>
              <p className="text-sm font-medium">{project.continent}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Climate</p>
              <p className="text-sm font-medium">{project.climate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Style</p>
              <p className="text-sm font-medium">{project.style}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Building Type</p>
              <p className="text-sm font-medium">{project.buildingType}</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {project.tags?.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 px-4 py-2 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Comments Sidebar */}
        <div className="lg:w-1/3">
          <div className="lg:sticky lg:top-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Comments Header */}
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">
                  Comments ({projectComments.length})
                </h2>
              </div>

              {/* Comments List */}
              <div className="max-h-[400px] overflow-y-auto p-5">
                {projectComments.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-sm">No comments yet</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Be the first to comment!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectComments.map((cmt, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {cmt.author}
                          </span>
                          <span className="text-xs text-gray-400">
                            {cmt.date}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{cmt.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-5 border-t border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorldProjectDetails;
