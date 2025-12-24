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
  additionalComments?: string;
  projectName: string;
  projectLocationSameAsClient?: boolean;
  projectCountry: string;
  projectState: string;
  projectCity: string;
  projectStreetAddress: string;
  projectZipCode: string;
  serviceType:
    | "NEW_CONSTRUCTION"
    | "RENOVATION"
    | "ADDITION"
    | "INTERIOR_DESIGN"
    | "LANDSCAPE_DESIGN"
    | "OTHER";
  projectCategory:
    | "RESIDENTIAL"
    | "COMMERCIAL"
    | "INSTITUTIONAL"
    | "LANDSCAPE"
    | "INTERIOR"
    | "URBAN_PLANNING";
  projectSize: string;
  budgetRange: string;
  preferredArchitecturalStyle?: string;
  siteConstraints?: string;
  sustainabilityGoals?: string;
  specialRequirements?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  additionalNotes?: string;
  files?: File[];
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
  additionalComments: string | null;
  projectName: string;
  projectLocationSameAsClient: boolean;
  projectCountry: string;
  projectState: string;
  projectCity: string;
  projectStreetAddress: string;
  projectZipCode: string;
  serviceType: string;
  projectCategory: string;
  projectSize: string;
  budgetRange: string;
  preferredArchitecturalStyle: string | null;
  siteConstraints: string | null;
  sustainabilityGoals: string | null;
  specialRequirements: string | null;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  additionalNotes: string | null;
  status: string;
  userId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: any | null;
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProjectRequest: builder.mutation<
      ProjectResponse,
      ProjectRequestPayload
    >({
      query: (data) => {
        const formData = new FormData();

        // Append all text fields
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
        formData.append("projectZipCode", data.projectZipCode);

        formData.append("serviceType", data.serviceType);
        formData.append("projectCategory", data.projectCategory);
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

        formData.append("appointmentDate", data.appointmentDate);
        formData.append("appointmentTime", data.appointmentTime);
        formData.append("appointmentType", data.appointmentType);
        if (data.additionalNotes)
          formData.append("additionalNotes", data.additionalNotes);

        // Append files
        if (data.files && data.files.length > 0) {
          data.files.forEach((file) => {
            formData.append("files", file);
          });
        }

        return {
          url: "/project-requests",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Project"],
    }),
  }),
});

export const { useCreateProjectRequestMutation } = projectApi;
