import { ProjectRequestPayload } from "@/redux/api/newProjectAPi";

// Define types for the maps to ensure they return the correct literal values
type ServiceTypeKey =
  | "new-construction"
  | "renovation"
  | "tenant-improvement"
  | "addition"
  | "consultation";
type ServiceTypeValue =
  | "NEW_CONSTRUCTION"
  | "RENOVATION"
  | "TENANT_IMPROVEMENT"
  | "ADDITION"
  | "INTERIOR_DESIGN"
  | "LANDSCAPE_DESIGN"
  | "OTHER";

type ProjectCategoryKey = "residential" | "commercial" | "other";
type ProjectCategoryValue =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INTERIOR"
  | "MIXED_USE"
  | "TENANT_IMPROVEMENT"
  | "REMODEL"
  | "ADDITION"
  | "OTHER";

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
  "tenant-improvement": "TENANT_IMPROVEMENT",
  addition: "ADDITION",
  consultation: "OTHER", // the "Other" option; free text lands in serviceTypeOther
};

const projectCategoryMap: Record<ProjectCategoryKey, ProjectCategoryValue> = {
  residential: "RESIDENTIAL",
  commercial: "COMMERCIAL",
  other: "OTHER", // free text lands in projectCategoryOther
};

export function buildProjectPayload(formData: any): ProjectRequestPayload {
  // Type-safe extraction with fallback
  const serviceTypeKey = (formData.serviceType ||
    "new-construction") as ServiceTypeKey;
  const projectCategoryKey = (formData.projectType ||
    "residential") as ProjectCategoryKey;

  const isInPerson = formData.appointmentType === "in-person";

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
    aptSuiteUnit: formData.aptSuiteUnit || undefined,
    zipCode: formData.zipCode || "",
    additionalComments: formData.additionalComments || undefined,

    projectName: formData.projectName || "",
    projectLocationSameAsClient: formData.projectLocationSameAsClient === true,

    projectCountry: formData.projectCountry || "",
    projectState: formData.projectState || "",
    projectCity: formData.projectCity || "",
    projectStreetAddress: formData.projectStreetAddress || "",
    projectAptSuiteUnit: formData.projectAptSuiteUnit || undefined,
    projectZipCode: formData.projectZipCode || "",

    serviceType: serviceType, // Now this is type-safe
    serviceTypeOther:
      serviceType === "OTHER"
        ? formData.serviceTypeOther || undefined
        : undefined,
    projectCategory: projectCategory, // Now this is type-safe
    projectCategoryOther:
      projectCategory === "OTHER"
        ? formData.projectTypeOther || undefined
        : undefined,

    // Grouped on the way out so the studio reads "2,500 sq ft", matching how
    // the field is displayed while typing.
    projectSize: formData.squareFootage
      ? `${Number(String(formData.squareFootage).replace(/[^\d]/g, '')).toLocaleString('en-US')} ${formData.projectSizeUnit === 'sqm' ? 'sq m' : 'sq ft'}`
      : "",
    budgetRange: formData.budgetRange || "",

    preferredArchitecturalStyle: formData.architecturalStyle || undefined,
    siteConstraints: formData.siteConstraints || undefined,
    sustainabilityGoals: formData.sustainabilityGoals || undefined,
    specialRequirements: formData.specialRequirements || undefined,

    // The two appointment types carry different things: a video call books a
    // slot, an in-person visit sends the address for the studio to arrange
    // around. Sending the other one's fields would only write data the user
    // never confirmed.
    appointmentDate: isInPerson
      ? undefined
      : formData.appointmentDate || undefined,
    appointmentTime: isInPerson
      ? undefined
      : formData.appointmentTime || undefined,
    appointmentType:
      appointmentTypeMap[formData.appointmentType] ||
      formData.appointmentType ||
      "",
    ...(isInPerson
      ? {
          meetingStreetAddress: formData.meetingStreetAddress || undefined,
          meetingAptSuiteUnit: formData.meetingAptSuiteUnit || undefined,
          meetingCity: formData.meetingCity || undefined,
          meetingState: formData.meetingState || undefined,
          meetingZipCode: formData.meetingZipCode || undefined,
          meetingCountry: formData.meetingCountry || undefined,
        }
      : {}),
    additionalNotes: formData.appointmentNotes || undefined,

    files: [
      ...(formData.additionalProjectPhotos || []),
      formData.propertyBoundarySurveyMap,
      formData.geotechnicalReport,
    ].filter(Boolean) as File[],
    paymentIntentId: formData.paymentIntentId,
  };
}
