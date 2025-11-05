import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useEffect, useRef } from "react";

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
};

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
}: ProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  console.log("ima the project", project);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup in case the modal unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  //  Close modal if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  // for previent the bg scrolling

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal Container */}
      <div ref={modalRef} className="bg-white rounded-2xl ">
        {/* Header Section */}
        <div className="px-8 pt-4 pb-2 space-y-2 border-b border-gray-200 ">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium rounded-md">
                  {project.stage}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium rounded-md">
                  {project.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Delete Inquiry
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center">
                <CheckCircle2Icon className="w-4 h-4 mr-2" />
                Mark Consultation Complete
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-8 mt-4">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Project Details</h3>
              <p className="text-sm text-blue-600 font-medium mb-6">
                Information about the project inquiry
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Project Type
                    </h4>
                    <p className="text-sm text-gray-600">{project.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Budget
                    </h4>
                    <p className="text-sm text-orange-600 font-medium">
                      ${project.budget}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Square Footage
                    </h4>
                    <p className="text-sm text-gray-600">
                      {project.squareFootage} sq ft
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Timeline
                    </h4>
                    <p className="text-sm text-gray-600">
                      {project?.timeline} months
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Location
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span>{project?.location}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Additional Notes
                  </h4>
                  <p className="text-sm text-gray-600">{project?.notes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Client Info & Consultation Details */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {project?.client}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MailIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-blue-600">
                    {project?.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {project?.client?.phone}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">State:</span>{" "}
                    {project?.client?.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Consultation Info */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Consultation Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {project?.consultation?.date}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {project?.consultation?.time}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Appointment type:</span>{" "}
                    <span className="text-orange-600 font-medium">
                      {project?.consultation?.type}
                    </span>
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Consultation Status
                    </span>
                    <span className="text-sm text-gray-600">
                      {project?.consultation?.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-300 h-2 rounded-full"
                      style={{ width: `${project?.consultation?.progress}%` }}
                    ></div>
                  </div>
                </div>

                <button className="w-full mt-4 border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50 text-sm font-medium py-2 rounded-md flex items-center justify-center">
                  <CheckCircle2Icon className="w-4 h-4 mr-2" />
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Close button (mobile visible) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}
