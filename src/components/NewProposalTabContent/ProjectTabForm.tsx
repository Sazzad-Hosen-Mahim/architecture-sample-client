import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useSubmitNewProposalMutation,
  useUpdateProposalDetailsMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import Cookies from "js-cookie";
import { toast } from "sonner";
import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "@/components/Common/LocationSelects";

interface ProjectFormProps {
  projectInfo: {
    projectName: string;
    projectDescription: string;
    additionalContext: string;
    streetAddress: string;
    city: string;
    country: string;
    state: string;
    zip: string;
    sameAsMailingAddress: boolean;
    serviceType: string;
    projectType: string;
    squareFootage: string;
    projectSizeUnit: string;
    budgetRange: string;
    // timeline: string;
  };
  handleProjectInfoChange: (field: string, value: string | boolean) => void;
  handleNext: () => void;
  handleBack: () => void;
  id: string | undefined;
}

export default function ProjectTabForm({
  projectInfo,
  handleProjectInfoChange,
  handleNext,
  handleBack,
  id,
}: ProjectFormProps) {
  const [submitNewProposal, { isLoading: isCreating }] =
    useSubmitNewProposalMutation();
  const [updateProposalDetails, { isLoading: isUpdating }] =
    useUpdateProposalDetailsMutation();
  const isLoading = isCreating || isUpdating;

  // The proposal this wizard run is already working on, if any. Stepping back
  // to this page and continuing again must edit that draft — creating a second
  // proposal here is what used to leave empty $0 drafts on the project and
  // strand the services added to the first one.
  const openDraft = (() => {
    try {
      const parsed = JSON.parse(Cookies.get("proposal_data") || "null");
      const draft = parsed?.data;
      if (!draft?.id) return null;
      // A cookie left over from another project must not be edited.
      if (
        draft.projectRequestId &&
        String(draft.projectRequestId) !== String(id)
      ) {
        return null;
      }
      return draft as { id: string; projectRequestId?: string };
    } catch {
      return null;
    }
  })();

  // Helper function to convert display values to API enum values
  const convertToApiFormat = (serviceType: string, projectType: string) => {
    const serviceTypeMapping: Record<string, string> = {
      "New Construction": "NEW_CONSTRUCTION",
      Renovation: "RENOVATION",
      "Tenant Improvement": "TENANT_IMPROVEMENT",
      Addition: "ADDITION",
      "Interior Design": "INTERIOR_DESIGN",
      "Landscape Design": "LANDSCAPE_DESIGN",
      Other: "OTHER",
    };

    const projectCategoryMapping: Record<string, string> = {
      Residential: "RESIDENTIAL",
      Commercial: "COMMERCIAL",
      Interior: "INTERIOR",
      "Mixed-Use": "MIXED_USE",
      "Tenant Improvement": "TENANT_IMPROVEMENT",
      Remodel: "REMODEL",
      Addition: "ADDITION",
      Other: "OTHER",
    };

    return {
      serviceType: serviceTypeMapping[serviceType] || serviceType,
      projectCategory: projectCategoryMapping[projectType] || projectType,
    };
  };

  const handleContinue = async () => {
    if (!id) {
      toast.error("No project is linked to this proposal.");
      return;
    }

    const { serviceType, projectCategory } = convertToApiFormat(
      projectInfo.serviceType,
      projectInfo.projectType,
    );

    const cleanPayload = {
      projectRequestId: String(id),
      name: String(projectInfo.projectName || ""),
      description: String(projectInfo.projectDescription || ""),
      additionalContext: String(projectInfo.additionalContext || ""),
      streetAddress: String(projectInfo.streetAddress || ""),
      city: String(projectInfo.city || ""),
      state: String(projectInfo.state || ""),
      country: String(projectInfo.country || ""),
      zip: String(projectInfo.zip || ""),
      serviceType: String(serviceType).toUpperCase().replace(/\s+/g, "_"),
      projectCategory: String(projectCategory)
        .toUpperCase()
        .replace(/\s+/g, "_"),
      squareFootage: projectInfo.squareFootage
        ? `${projectInfo.squareFootage} ${projectInfo.projectSizeUnit === "sqm" ? "sq m" : "sq ft"}`
        : "",
      budgetRange: String(projectInfo.budgetRange || ""),
      // expectedTimeline: String(projectInfo.timeline || ""),
    };

    // Persist the wizard's proposal id so the Services and Review steps keep
    // writing to the very same row.
    const rememberProposal = (proposal: any) => {
      Cookies.set(
        "proposal_data",
        JSON.stringify({
          data: {
            id: proposal?.id,
            proposalNumber: proposal?.proposalNumber,
            createdAt: proposal?.createdAt,
            projectRequestId: proposal?.projectRequestId || id,
          },
        }),
        { expires: 7 },
      );
    };

    if (openDraft) {
      try {
        const response = await updateProposalDetails({
          id: openDraft.id,
          ...cleanPayload,
        }).unwrap();
        rememberProposal(response?.data ?? { id: openDraft.id });
        handleNext();
        return;
      } catch (error: any) {
        // The draft is gone or no longer editable (already sent) — fall through
        // and start a fresh proposal rather than dead-ending the PM here.
        console.error(
          "Failed to update the open draft, creating a new one:",
          error,
        );
        Cookies.remove("proposal_data");
      }
    }

    try {
      const response = await submitNewProposal(cleanPayload).unwrap();
      rememberProposal(response?.data);
      handleNext();
    } catch (error: any) {
      console.error("Failed to create proposal:", error);
      toast.error(
        error?.data?.message ||
          "Could not save the project details. Please try again.",
      );
    }
  };

  return (
    <div className="bg-white  ">
      <h2 className="text-sm font-semibold mb-6 border-l-4 border-blue-600 pl-3">
        Project Information
      </h2>

      {/* Project Name */}
      <div className="mb-6">
        <Label htmlFor="projectName" className="mb-3">
          Project Name
        </Label>
        <Input
          id="projectName"
          value={projectInfo.projectName}
          onChange={(e) =>
            handleProjectInfoChange("projectName", e.target.value)
          }
        />
      </div>

      {/* Project Description */}
      <div className="mb-4">
        <Label htmlFor="projectDescription" className="mb-3">
          Project Description
        </Label>
        <Textarea
          id="projectDescription"
          rows={4}
          value={projectInfo.projectDescription}
          placeholder="Describe the project scope, purpose, and goals"
          onChange={(e) =>
            handleProjectInfoChange("projectDescription", e.target.value)
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          This description will appear in the Project Understanding section
        </p>
      </div>

      {/* Additional Context */}
      <div className="mb-4">
        <Label htmlFor="additionalContext" className="mb-3">
          Additional Project Context
        </Label>
        <Textarea
          id="additionalContext"
          rows={4}
          placeholder="Describe additional context or specific requests from the client"
          value={projectInfo.additionalContext}
          onChange={(e) =>
            handleProjectInfoChange("additionalContext", e.target.value)
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          This will appear as additional context in the Project Understanding
        </p>
      </div>

      {/* Project Location */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="projectLocation">Project Location</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsMailingAddress"
              checked={projectInfo.sameAsMailingAddress}
              onCheckedChange={(checked) =>
                handleProjectInfoChange(
                  "sameAsMailingAddress",
                  checked === true,
                )
              }
            />
            <label
              htmlFor="sameAsMailingAddress"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Same as mailing address
            </label>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="streetAddress" className="mb-3">
            Street Address
          </Label>
          <Input
            id="streetAddress"
            value={projectInfo.streetAddress}
            onChange={(e) =>
              handleProjectInfoChange("streetAddress", e.target.value)
            }
          />
        </div>

        {/* Country / State / City / ZIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectCountry">Country</Label>
            <CountrySelect
              id="projectCountry"
              value={projectInfo.country}
              onChange={(value) => {
                handleProjectInfoChange("country", value);
                handleProjectInfoChange("state", "");
                handleProjectInfoChange("city", "");
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="projectState">State</Label>
            <StateSelect
              id="projectState"
              country={projectInfo.country}
              value={projectInfo.state}
              onChange={(value) => {
                handleProjectInfoChange("state", value);
                handleProjectInfoChange("city", "");
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="projectCity">City</Label>
            <CitySelect
              id="projectCity"
              country={projectInfo.country}
              state={projectInfo.state}
              value={projectInfo.city}
              onChange={(value) => handleProjectInfoChange("city", value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="projectZip">Zip Code</Label>
            <Input
              id="projectZip"
              value={projectInfo.zip}
              onChange={(e) => handleProjectInfoChange("zip", e.target.value)}
              placeholder="Enter zip / postal code"
            />
          </div>
        </div>
      </div>

      {/* Project Specifications */}
      <h3 className="font-medium text-sm py-4 mb-3">Project Specifications</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="serviceType">Service Type</Label>
          <Select
            value={projectInfo.serviceType}
            onValueChange={(value) =>
              handleProjectInfoChange("serviceType", value)
            }
          >
            <SelectTrigger id="serviceType" className="w-full">
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="New Construction">New Construction</SelectItem>
              <SelectItem value="Renovation">Renovation</SelectItem>
              <SelectItem value="Tenant Improvement">
                Tenant Improvement
              </SelectItem>
              <SelectItem value="Addition">Addition</SelectItem>
              <SelectItem value="Interior Design">Interior Design</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="projectType">Project Type</Label>
          <Select
            value={projectInfo.projectType}
            onValueChange={(value) =>
              handleProjectInfoChange("projectType", value)
            }
          >
            <SelectTrigger id="projectType" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Interior">Interior</SelectItem>
              <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
              <SelectItem value="Tenant Improvement">
                Tenant Improvement
              </SelectItem>
              <SelectItem value="Remodel">Remodel</SelectItem>
              <SelectItem value="Addition">Addition</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="squareFootage">Project Size (Estimate)</Label>
          <div className="flex justify-center items-center w-full">
            <Input
              id="squareFootage"
              type="number"
              value={projectInfo.squareFootage}
              onChange={(e) =>
                handleProjectInfoChange("squareFootage", e.target.value)
              }
              className="flex-1 border-r-0 rounded-r-none"
            />
            <div>
              <Select
                value={projectInfo.projectSizeUnit || "sqf"}
                onValueChange={(v) =>
                  handleProjectInfoChange("projectSizeUnit", v)
                }
              >
                <SelectTrigger className="w-full border-l-0 border-gray-300 rounded-l-none bg-gray-300">
                  <SelectValue placeholder="sq² / m²" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem
                    value="sqf"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    sq²
                  </SelectItem>
                  <SelectItem
                    value="sqm"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    m²
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="budgetRange">Budget Range</Label>
          <Input
            id="budgetRange"
            value={projectInfo.budgetRange}
            onChange={(e) =>
              handleProjectInfoChange("budgetRange", e.target.value)
            }
            placeholder="e.g. $250,000"
            className="w-full"
          />
        </div>

        {/* <div className="flex flex-col gap-2">
          <Label htmlFor="timeline">Expected Timeline</Label>
          <Select
            value={projectInfo.timeline}
            onValueChange={(value) =>
              handleProjectInfoChange("timeline", value)
            }
          >
            <SelectTrigger id="timeline" className="w-full">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="Under 6 months">Under 6 months</SelectItem>
              <SelectItem value="6-12 months">6-12 months</SelectItem>
              <SelectItem value="1-2 years">1-2 years</SelectItem>
              <SelectItem value="Over 2 years">Over 2 years</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className="cursor-pointer hover:bg-gray-200 hover:border-gray-200"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-gray-800 text-white hover:bg-black cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Continue to Services"}
        </Button>
      </div>
    </div>
  );
}
