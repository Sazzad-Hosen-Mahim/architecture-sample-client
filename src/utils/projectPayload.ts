import { ProjectRequestPayload } from "@/redux/api/newProjectAPi";

// Define types for the maps to ensure they return the correct literal values
type ServiceTypeKey =
  | "new-construction"
  | "renovation"
  | "addition"
  | "consultation";
type ServiceTypeValue =
  | "NEW_CONSTRUCTION"
  | "RENOVATION"
  | "ADDITION"
  | "INTERIOR_DESIGN"
  | "LANDSCAPE_DESIGN"
  | "OTHER";

type ProjectCategoryKey = "residential" | "commercial" | "other";
type ProjectCategoryValue =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INSTITUTIONAL"
  | "LANDSCAPE"
  | "INTERIOR"
  | "URBAN_PLANNING";

// Use type-safe maps
const appointmentTypeMap: Record<string, string> = {
  "in-person": "In-person Meeting",
  "video-call": "Video Consultation",
  "phone-call": "Phone Call",
  email: "Email",
};

const serviceTypeMap: Record<ServiceTypeKey, ServiceTypeValue> = {
  "new-construction": "NEW_CONSTRUCTION",
  renovation: "RENOVATION",
  addition: "ADDITION",
  consultation: "OTHER", // or whatever you want for "Other"
};

const projectCategoryMap: Record<ProjectCategoryKey, ProjectCategoryValue> = {
  residential: "RESIDENTIAL",
  commercial: "COMMERCIAL",
  other: "RESIDENTIAL", // Changed from "OTHER" to "RESIDENTIAL" since "OTHER" isn't a valid option
  // If you need "OTHER" as an option, update your ProjectRequestPayload interface
};

export function buildProjectPayload(formData: any): ProjectRequestPayload {
  // Type-safe extraction with fallback
  const serviceTypeKey = (formData.serviceType ||
    "new-construction") as ServiceTypeKey;
  const projectCategoryKey = (formData.projectType ||
    "residential") as ProjectCategoryKey;

  // Use the maps with type safety
  const serviceType = serviceTypeMap[serviceTypeKey] || "NEW_CONSTRUCTION";
  const projectCategory =
    projectCategoryMap[projectCategoryKey] || "RESIDENTIAL";

  // Alternative: If you want to handle invalid values more explicitly:
  // const serviceType = serviceTypeMap[serviceTypeKey as ServiceTypeKey] ?? "NEW_CONSTRUCTION";
  // const projectCategory = projectCategoryMap[projectCategoryKey as ProjectCategoryKey] ?? "RESIDENTIAL";

  return {
    clientFirstName: formData.firstName || "",
    clientMiddleName: formData.middleInitial || undefined,
    clientLastName: formData.lastName || "",
    companyName: formData.companyName || undefined,
    email: formData.email || "",
    phone: formData.phone || "",
    country: formData.country || "",
    state: formData.state || "",
    city: formData.city || "",
    streetAddress: formData.address || "",
    additionalComments: formData.additionalComments || undefined,

    projectName: formData.projectName || "",
    projectLocationSameAsClient:
      formData.country === formData.projectCountry &&
      formData.state === formData.projectState &&
      formData.city === formData.projectCity &&
      formData.address === formData.projectStreetAddress,

    projectCountry: formData.projectCountry || "",
    projectState: formData.projectState || "",
    projectCity: formData.projectCity || "",
    projectStreetAddress: formData.projectStreetAddress || "",
    projectZipCode: formData.projectZipCode || "",

    serviceType: serviceType, // Now this is type-safe
    projectCategory: projectCategory, // Now this is type-safe

    projectSize: formData.squareFootage
      ? `${formData.squareFootage} sq ft`
      : "",
    budgetRange: formData.budgetRange || "",

    preferredArchitecturalStyle: formData.architecturalStyle || undefined,
    siteConstraints: formData.siteConstraints || undefined,
    sustainabilityGoals: formData.sustainabilityGoals || undefined,
    specialRequirements: formData.specialRequirements || undefined,

    appointmentDate: formData.appointmentDate || "",
    appointmentTime: formData.appointmentTime || "",
    appointmentType:
      appointmentTypeMap[formData.appointmentType] ||
      formData.appointmentType ||
      "",
    additionalNotes: formData.appointmentNotes || undefined,

    files: [
      ...(formData.additionalProjectPhotos || []),
      formData.propertyBoundarySurveyMap,
      formData.geotechnicalReport,
    ].filter(Boolean) as File[],
    paymentIntentId: formData.paymentIntentId,
  };
}
