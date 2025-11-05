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
    budgetRange: string;
    timeline: string;
  };
  handleProjectInfoChange: (field: string, value: string | boolean) => void;
  handleNext: () => void;
  handleBack: () => void;
}

export default function ProjectTabForm({
  projectInfo,
  handleProjectInfoChange,
  handleNext,
  handleBack,
}: ProjectFormProps) {
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
                  checked === true
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

        {/* Country / City / State / ZIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectCountry">Country</Label>
            <Select
              value={projectInfo.country}
              onValueChange={(value) =>
                handleProjectInfoChange("country", value)
              }
            >
              <SelectTrigger id="projectCountry" className="w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="projectCity">City</Label>
            <Input
              id="projectCity"
              value={projectInfo.city}
              onChange={(e) => handleProjectInfoChange("city", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="projectState">State</Label>
            <Select
              value={projectInfo.state}
              onValueChange={(value) => handleProjectInfoChange("state", value)}
            >
              <SelectTrigger id="projectState" className="w-full">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="projectZip">ZIP</Label>
            <Input
              id="projectZip"
              value={projectInfo.zip}
              onChange={(e) => handleProjectInfoChange("zip", e.target.value)}
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
              <SelectItem value="Addition">Addition</SelectItem>
              <SelectItem value="Interior Design">Interior Design</SelectItem>
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
              <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
              <SelectItem value="Institutional">Institutional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="squareFootage">Square Footage</Label>
          <Input
            id="squareFootage"
            type="number"
            value={projectInfo.squareFootage}
            onChange={(e) =>
              handleProjectInfoChange("squareFootage", e.target.value)
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="budgetRange">Budget Range</Label>
          <Select
            value={projectInfo.budgetRange}
            onValueChange={(value) =>
              handleProjectInfoChange("budgetRange", value)
            }
          >
            <SelectTrigger id="budgetRange" className="w-full">
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="Under $100k">Under $100k</SelectItem>
              <SelectItem value="$100k-$250k">$100k-$250k</SelectItem>
              <SelectItem value="$250k-$500k">$250k-$500k</SelectItem>
              <SelectItem value="$500k-$1M">$500k-$1M</SelectItem>
              <SelectItem value="Over $1M">Over $1M</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
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
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-gray-800 text-white hover:bg-black cursor-pointer"
        >
          Continue to Services
        </Button>
      </div>
    </div>
  );
}
