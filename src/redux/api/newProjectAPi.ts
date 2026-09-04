// src/features/project/projectApi.ts

import { baseApi } from "./baseApi";

// Update your baseApi.ts file to include "Project" in tagTypes:
// tagTypes: ["User", "Project"],

export interface ProjectRequestPayload {
  clientFirstName: string;
  clientMiddleName?: string;
  clientLastName: string;
  companyName?: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  aptSuiteUnit?: string;
  zipCode: string;
  additionalComments?: string;
  projectName: string;
  projectLocationSameAsClient?: boolean;
  projectCountry: string;
  projectState: string;
  projectCity: string;
  projectStreetAddress: string;
  projectAptSuiteUnit?: string;
  projectZipCode: string;
  serviceType:
    | "NEW_CONSTRUCTION"
    | "RENOVATION"
    | "TENANT_IMPROVEMENT"
    | "ADDITION"
    | "INTERIOR_DESIGN"
    | "LANDSCAPE_DESIGN"
    | "OTHER";
  serviceTypeOther?: string;
  projectCategory:
    | "RESIDENTIAL"
    | "COMMERCIAL"
    | "INTERIOR"
    | "MIXED_USE"
    | "TENANT_IMPROVEMENT"
    | "REMODEL"
    | "ADDITION"
    | "OTHER";
  projectCategoryOther?: string;
  projectSize: string;
  budgetRange: string;
  preferredArchitecturalStyle?: string;
  siteConstraints?: string;
  sustainabilityGoals?: string;
  specialRequirements?: string;
  // Absent for in-person meetings — those are scheduled after review.
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType: string;
  // In-person only. The server composes the one-line `meetingLocation` from
  // these, so it is never sent from here.
  meetingStreetAddress?: string;
  meetingAptSuiteUnit?: string;
  meetingCity?: string;
  meetingState?: string;
  meetingZipCode?: string;
  meetingCountry?: string;
  additionalNotes?: string;
  files?: File[];
  paymentIntentId?: string;
}

export interface ProjectResponse {
  id: string;
  clientFirstName: string;
  clientMiddleName: string | null;
  clientLastName: string;
  companyName: string | null;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  aptSuiteUnit: string | null;
  zipCode: string | null;
  additionalComments: string | null;
  projectName: string;
  projectLocationSameAsClient: boolean;
  projectCountry: string;
  projectState: string;
  projectCity: string;
  projectStreetAddress: string;
  projectAptSuiteUnit: string | null;
  projectZipCode: string;
  serviceType: string;
  projectCategory: string;
  projectSize: string;
  budgetRange: string;
  preferredArchitecturalStyle: string | null;
  siteConstraints: string | null;
  sustainabilityGoals: string | null;
  specialRequirements: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentType: string;
  /** One-line rendering of the meeting address fields below. */
  meetingLocation: string | null;
  meetingStreetAddress: string | null;
  meetingAptSuiteUnit: string | null;
  meetingCity: string | null;
  meetingState: string | null;
  meetingZipCode: string | null;
  meetingCountry: string | null;
  additionalNotes: string | null;
  status: string;
  userId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: any | null;
}

// The public (no-account) and authenticated submit endpoints send the exact
// same multipart body — only the URL and auth differ.
function buildProjectRequestFormData(data: ProjectRequestPayload): FormData {
  const formData = new FormData();

  formData.append("clientFirstName", data.clientFirstName);
  if (data.clientMiddleName)
    formData.append("clientMiddleName", data.clientMiddleName);
  formData.append("clientLastName", data.clientLastName);
  if (data.companyName) formData.append("companyName", data.companyName);
  formData.append("email", data.email);
  formData.append("phone", data.phone);
  formData.append("country", data.country);
  formData.append("state", data.state);
  formData.append("city", data.city);
  formData.append("streetAddress", data.streetAddress);
  if (data.aptSuiteUnit) formData.append("aptSuiteUnit", data.aptSuiteUnit);
  if (data.zipCode) formData.append("zipCode", data.zipCode);
  if (data.additionalComments)
    formData.append("additionalComments", data.additionalComments);

  formData.append("projectName", data.projectName);
  if (data.projectLocationSameAsClient !== undefined) {
    formData.append(
      "projectLocationSameAsClient",
      String(data.projectLocationSameAsClient)
    );
  }
  formData.append("projectCountry", data.projectCountry);
  formData.append("projectState", data.projectState);
  formData.append("projectCity", data.projectCity);
  formData.append("projectStreetAddress", data.projectStreetAddress);
  if (data.projectAptSuiteUnit)
    formData.append("projectAptSuiteUnit", data.projectAptSuiteUnit);
  formData.append("projectZipCode", data.projectZipCode);

  formData.append("serviceType", data.serviceType);
  if (data.serviceTypeOther)
    formData.append("serviceTypeOther", data.serviceTypeOther);
  formData.append("projectCategory", data.projectCategory);
  if (data.projectCategoryOther)
    formData.append("projectCategoryOther", data.projectCategoryOther);
  formData.append("projectSize", data.projectSize);
  formData.append("budgetRange", data.budgetRange);

  if (data.preferredArchitecturalStyle)
    formData.append(
      "preferredArchitecturalStyle",
      data.preferredArchitecturalStyle
    );
  if (data.siteConstraints)
    formData.append("siteConstraints", data.siteConstraints);
  if (data.sustainabilityGoals)
    formData.append("sustainabilityGoals", data.sustainabilityGoals);
  if (data.specialRequirements)
    formData.append("specialRequirements", data.specialRequirements);

  // Conditional: an in-person request has no slot, and appending an empty
  // string would fail the server's @IsDateString check rather than being
  // treated as "not provided".
  if (data.appointmentDate)
    formData.append("appointmentDate", data.appointmentDate);
  if (data.appointmentTime)
    formData.append("appointmentTime", data.appointmentTime);
  formData.append("appointmentType", data.appointmentType);
  if (data.meetingStreetAddress)
    formData.append("meetingStreetAddress", data.meetingStreetAddress);
  if (data.meetingAptSuiteUnit)
    formData.append("meetingAptSuiteUnit", data.meetingAptSuiteUnit);
  if (data.meetingCity) formData.append("meetingCity", data.meetingCity);
  if (data.meetingState) formData.append("meetingState", data.meetingState);
  if (data.meetingZipCode)
    formData.append("meetingZipCode", data.meetingZipCode);
  if (data.meetingCountry)
    formData.append("meetingCountry", data.meetingCountry);
  if (data.additionalNotes)
    formData.append("additionalNotes", data.additionalNotes);

  formData.append("paymentIntentId", data.paymentIntentId || "");

  if (data.files && data.files.length > 0) {
    data.files.forEach((file) => {
      formData.append("files", file);
    });
  }

  return formData;
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProjectRequest: builder.mutation<
      ProjectResponse,
      ProjectRequestPayload
    >({
      query: (data) => ({
        url: "/project-requests",
        method: "POST",
        body: buildProjectRequestFormData(data),
      }),
      invalidatesTags: ["Project"],
    }),

    // Submitted without an account. The consultation fee must already be paid
    // (against the typed email); the studio then accepts or declines.
    createProjectRequestPublic: builder.mutation<
      { success: boolean; message: string; data: { id: string } },
      ProjectRequestPayload
    >({
      query: (data) => ({
        url: "/project-requests/public",
        method: "POST",
        body: buildProjectRequestFormData(data),
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const {
  useCreateProjectRequestMutation,
  useCreateProjectRequestPublicMutation,
} = projectApi;
