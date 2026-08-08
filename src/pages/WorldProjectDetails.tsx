import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  // ArrowLeft,
  // Send,
  MapPin,
  Calendar,
  User,
  Camera,
  // Heart,
} from "lucide-react";
// import { Button } from "@/components/ui/button";
import {
  useGetMediaByIdOrSlugQuery,
  // useToggleLikeMutation,
  // useCreateCommentMutation,
  // useGetMediaCommentsQuery
} from "@/redux/features/Media/mediaApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

function WorldProjectDetails() {
  const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate();

  // const [newComment, setNewComment] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: response, isLoading } = useGetMediaByIdOrSlugQuery(id || "");
  // const { data: commentResponse } = useGetMediaCommentsQuery({ id: id || "" }, { skip: !id });
  // const [toggleLike] = useToggleLikeMutation();
  // const [addComment] = useCreateCommentMutation();

  const item = response?.data;

  const project = useMemo(() => {
    if (!item) return null;
    return {
      id: item.id,
      name: item.title,
      PublishedDate: item.publishDate ? new Date(item.publishDate).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString(),
      Architect: item.architect || "TBA",
      Photographer: item.photographer || "TBA",
      description: item.content,
      locationName: item.location || (item.city ? `${item.city}, ${item.country}` : "Global"),
      country: item.country || "TBA",
      // continent is showing all capital I want first letter to be capital 
      // this is the response "continent": "ASIA",
      // "climate": "TROPICAL",
      continent: item.continent
        ? item.continent.charAt(0).toUpperCase() + item.continent.slice(1).toLowerCase()
        : "TBA",
      year: item.projectYear || 2024,
      tags: item.projectTags || [],
      images: item.assets?.map((a: any) => a.cdnUrl) || [],
      climate: item.climate
        ? item.climate.charAt(0).toUpperCase() + item.climate.slice(1).toLowerCase()
        : "TBA",
      style: "Modern",
      buildingType: item.category || "Building",
      likeCount: item.likeCount || 0,
    };
  }, [item]);

  // const handleVote = async () => {
  //   if (!id) return;
  //   try {
  //     await toggleLike(id).unwrap();
  //   } catch (err) {
  //     console.error("Failed to vote:", err);
  //   }
  // };

  // const handleAddComment = async () => {
  //   if (!id || !newComment.trim()) return;
  //   try {
  //     await addComment({ id, content: newComment.trim() }).unwrap();
  //     setNewComment("");
  //   } catch (err) {
  //     console.error("Failed to post comment:", err);
  //   }
  // };

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-xl font-semibold mb-4">Project not found</h2>
          {/* <Button onClick={() => navigate("/world-project")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button> */}
        </div>
      </div>
    );
  }

  // const projectComments = commentResponse?.data || [];

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 pb-20">
      {/* Back Button */}
      {/* <button
        onClick={() => navigate("/world-project")}
        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Projects</span>
      </button> */}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Section */}
        <div className="flex-1 ">
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
            <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-4">
              <img
                src={project.images[selectedImage] || "/placeholder.svg"}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            {project.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {project.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
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
          {/* <div className="mb-6">
            <button
              onClick={handleVote}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Heart size={18} />
              <span>Vote ({project.likeCount})</span>
            </button>
          </div> */}

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <div className="bg-gray-50 md:col-span-2 rounded-xl p-3 mb-6 ">
                <h2 className="text-lg font-semibold mb-4">Project Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <User size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Architect</p>
                      <p className="text-sm font-medium">{project.Architect}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Camera size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Photographer</p>
                      <p className="text-sm font-medium">{project.Photographer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Camera size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Continent</p>
                      <p className="text-sm font-medium">{project.continent}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Calendar size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Climate</p>
                      <p className="text-sm font-medium">{project.climate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-6"><div>
              <h2 className="text-lg font-semibold mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {project.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div></div>

          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Additional Info */}


          {/* Tags */}

        </div>
      </div>
      <div className="mb-22 mt-12">
        <HeroSocialMedia />
      </div>
    </div>
  );
}

export default WorldProjectDetails;
