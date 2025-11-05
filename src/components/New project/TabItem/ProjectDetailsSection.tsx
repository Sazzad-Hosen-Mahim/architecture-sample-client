import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { countries, usStates } from "@/data/countries-states";
import { worldProjects } from "@/data/worldProjects";
import React from "react";
// import ThumbprintButton from "../ThumbprintButton";

export default function ProjectDetailsSection({
  formData,
  updateFormData,
  goToNextSection,
  goToPreviousSection,
}: any) {
  const [sameAsMailingAddress] = React.useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (!sameAsMailingAddress || !name.startsWith("project")) {
      updateFormData({ [name]: value });
    }
  };

  const handleSelectChange = (name: any, value: any) => {
    if (name === "projectCountry") {
      if (value === "Select Country") {
        updateFormData({ [name]: "", projectState: "" });
      } else if (
        value !== "United States" &&
        formData.projectState !== "Outside of U.S. Jurisdiction"
      ) {
        updateFormData({
          [name]: value,
          projectState: "Outside of U.S. Jurisdiction",
        });
      } else {
        updateFormData({ [name]: value });
      }
    } else {
      updateFormData({ [name]: value });
    }
  };

  //   const handleSameAsMailingAddressChange = (checked: boolean) => {
  //     setSameAsMailingAddress(checked);
  //     if (checked) {
  //       updateFormData({
  //         projectStreetAddress: formData.streetAddress,
  //         projectCity: formData.city,
  //         projectState: formData.state,
  //         projectZipCode: formData.zipCode,
  //         projectCountry: formData.country,
  //       });
  //     }
  //   };

  return (
    <div>
      <div className="space-y-6 pb-6 ">
        <div>
          <h2 className="text-base font-medium mb-4">Project Name</h2>
          <div>
            <Label htmlFor="projectName" className="text-xs font-normal">
              Name
            </Label>
            <Input
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              className="mt-1"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">Project Location</h2>
            {/* <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsMailingAddress"
              checked={sameAsMailingAddress}
              onCheckedChange={(checked) => handleSameAsMailingAddressChange(checked as boolean)}
            />
            <Label htmlFor="sameAsMailingAddress" className="text-sm">
              Same as mailing address
            </Label>
          </div> */}
          </div>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="projectStreetAddress"
                className="text-xs font-normal"
              >
                Street Address
              </Label>
              <Input
                id="projectStreetAddress"
                name="projectStreetAddress"
                value={formData.projectStreetAddress}
                onChange={handleInputChange}
                className="mt-1"
                required
                disabled={sameAsMailingAddress}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="projectCity" className="text-xs font-normal">
                  City
                </Label>
                <Input
                  id="projectCity"
                  name="projectCity"
                  value={formData.projectCity}
                  onChange={handleInputChange}
                  className="mt-1"
                  required
                  disabled={sameAsMailingAddress}
                />
              </div>
              <div className="">
                <Label htmlFor="projectState" className="text-xs font-normal ">
                  State
                </Label>
                <Select
                  name="projectState"
                  value={formData.projectState}
                  onValueChange={(value) =>
                    handleSelectChange("projectState", value)
                  }
                  disabled={sameAsMailingAddress}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {usStates.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Outside of U.S. Jurisdiction">
                      Outside of U.S. Jurisdiction
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="">
                <Label htmlFor="projectZipCode" className="text-xs font-normal">
                  Zip Code
                </Label>
                <Input
                  id="projectZipCode"
                  name="projectZipCode"
                  value={formData.projectZipCode}
                  onChange={handleInputChange}
                  className="mt-1"
                  required
                  disabled={sameAsMailingAddress}
                />
              </div>
            </div>
            {/* <div className="grid grid-cols-2 gap-4">
            
          </div> */}
          </div>
        </div>

        {/* project specifications  */}
        <div>
          <h2 className="text-base font-medium mb-4">Project Specifications</h2>
          <div className="space-y-4 ">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceType" className="text-xs font-normal">
                  Service Type
                </Label>
                <Select
                  name="serviceType"
                  value={formData.serviceType || "new-construction"}
                  onValueChange={(value) =>
                    handleSelectChange("serviceType", value)
                  }
                >
                  <SelectTrigger id="serviceType" className="mt-1 w-full">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="new-construction">
                      New Construction
                    </SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="addition">Addition</SelectItem>
                    <SelectItem value="interior-design">
                      Interior Design
                    </SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="projectType" className="text-xs font-normal">
                  Project Type
                </Label>
                <Select
                  name="projectType"
                  value={formData.projectType}
                  onValueChange={(value) =>
                    handleSelectChange("projectType", value)
                  }
                  disabled={sameAsMailingAddress}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Project Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {worldProjects.map((project) => (
                      <SelectItem
                        key={project.name}
                        value={project.name}
                        className="bg-white"
                      >
                        <div className="flex items-center">{project.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="projectCountry" className="text-xs font-normal">
                Country
              </Label>
              <Select
                name="projectCountry"
                value={formData.projectCountry}
                onValueChange={(value) =>
                  handleSelectChange("projectCountry", value)
                }
                disabled={sameAsMailingAddress}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem
                      key={country.code}
                      value={country.name}
                      className="bg-white"
                    >
                      <div className="flex items-center">
                        {country.code && (
                          <img
                            src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                            width={20}
                            height={15}
                            alt={`${country.name} flag`}
                            className="mr-2 w-20 h-14"
                          />
                        )}
                        {country.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="squareFootage" className="text-xs font-normal">
                Square Footage
              </Label>
              <Input
                id="squareFootage"
                name="squareFootage"
                type="number"
                value={formData.squareFootage}
                onChange={handleInputChange}
                className="mt-1"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-4">
            Project Timeline and Budget
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectTimeline" className="text-xs font-normal">
                Expected Project Timeline
              </Label>
              <Select
                name="projectTimeline"
                value={formData.projectTimeline}
                onValueChange={(value) =>
                  handleSelectChange("projectTimeline", value)
                }
              >
                <SelectTrigger id="projectTimeline" className="mt-1 w-full">
                  <SelectValue placeholder="Select expected timeline" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="0-6-months">0-6 months</SelectItem>
                  <SelectItem value="6-12-months">6-12 months</SelectItem>
                  <SelectItem value="1-2-years">1-2 years</SelectItem>
                  <SelectItem value="2-plus-years">2+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budgetRange" className="text-xs font-normal">
                Budget Range
              </Label>
              <Select
                name="budgetRange"
                value={formData.budgetRange}
                onValueChange={(value) =>
                  handleSelectChange("budgetRange", value)
                }
              >
                <SelectTrigger id="budgetRange" className="mt-1 w-full ">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="under-100k">Under $100,000</SelectItem>
                  <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                  <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                  <SelectItem value="500k-1m">$500,000 - $1 million</SelectItem>
                  <SelectItem value="over-1m">Over $1 million</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-4">
            Architectural Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="architecturalStyle"
                className="text-xs font-normal"
              >
                Preferred Architectural Style
              </Label>
              <Textarea
                id="architecturalStyle"
                name="architecturalStyle"
                value={formData.architecturalStyle}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="e.g., Modern, Traditional, Mediterranean, etc."
              />
            </div>
            <div>
              <Label htmlFor="siteConstraints" className="text-xs font-normal">
                Site Constraints or Challenges
              </Label>
              <Textarea
                id="siteConstraints"
                name="siteConstraints"
                value={formData.siteConstraints}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="e.g., Sloped terrain, flood zone, etc."
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-4">
            Sustainability and Special Requirements
          </h2>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="sustainabilityGoals"
                className="text-xs font-normal"
              >
                Sustainability Goals
              </Label>
              <Textarea
                id="sustainabilityGoals"
                name="sustainabilityGoals"
                value={formData.sustainabilityGoals}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="e.g., LEED certification, energy efficiency, etc."
              />
            </div>
            <div>
              <Label
                htmlFor="specialRequirements"
                className="text-xs font-normal"
              >
                Special Requirements or Accessibility Needs
              </Label>
              <Textarea
                id="specialRequirements"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="e.g., ADA compliance, home office, etc."
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-4">Required Documents</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="propertyBoundarySurveyMap"
                  className="text-xs font-normal"
                >
                  Property Boundary/Survey Map
                </Label>
                <Input
                  id="propertyBoundarySurveyMap"
                  name="propertyBoundarySurveyMap"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      updateFormData({
                        propertyBoundarySurveyMap: e.target.files[0],
                      });
                    }
                  }}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="propertyBoundarySurveyMap"
                  className="text-xs font-normal"
                >
                  Geotechnical Report/Survey
                </Label>
                <Input
                  id="geotechnicalReport"
                  name="geotechnicalReport"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      updateFormData({
                        geotechnicalReport: e.target.files[0],
                      });
                    }
                  }}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="additionalProjectPhotos"
                className="text-xs font-normal"
              >
                Additional Project Photos (Optional)
              </Label>
              <Input
                id="additionalProjectPhotos"
                name="additionalProjectPhotos"
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    updateFormData({
                      additionalProjectPhotos: Array.from(e.target.files),
                    });
                  }
                }}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                goToPreviousSection();
              }}
            >
              Previous
            </Button>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          {/* <ThumbprintButton
            onClick={goToNextSection}
            text="Schedule Appointment"
          /> */}
          <button
            onClick={goToNextSection}
            className="w-20 h-26 text-xs cursor-pointer bg-black rounded-full text-white shadow-lg flex items-center justify-center focus:outline-none transition-all duration-300 ease-in-out hover:scale-105 relative overflow-hidden"
          >
            Schedule Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
