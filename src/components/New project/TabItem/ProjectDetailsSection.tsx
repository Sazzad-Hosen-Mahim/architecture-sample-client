/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { countries } from "@/data/countries-states";

interface ProjectDetailsSectionProps {
  formData: any;
  updateFormData: (data: any) => void;
  goToNextSection: () => void;
  goToPreviousSection: () => void;
}

export default function ProjectDetailsSection({
  formData,
  updateFormData,
  goToNextSection,
  goToPreviousSection,
}: ProjectDetailsSectionProps) {
  /* ------------------------------------------------------------------ */
  /* 1. Local copy of the whole project-address block                     */
  /* ------------------------------------------------------------------ */
  const [localFormData, setLocalFormData] = useState({
    // ----- basic project fields -----
    projectName: formData?.projectName || "",
    serviceType: formData?.serviceType || "new-construction",
    projectType: formData?.projectType || "",
    squareFootage: formData?.squareFootage || "",
    projectTimeline: formData?.projectTimeline || "",
    budgetRange: formData?.budgetRange || "",
    architecturalStyle: formData?.architecturalStyle || "",
    siteConstraints: formData?.siteConstraints || "",
    sustainabilityGoals: formData?.sustainabilityGoals || "",
    specialRequirements: formData?.specialRequirements || "",
    serviceTypeOther: formData?.serviceTypeOther || "",
    projectTypeOther: formData?.projectTypeOther || "",

    // ----- address fields (the ones we make dynamic) -----
    projectStreetAddress: formData?.projectStreetAddress || "",
    projectCity: formData?.projectCity || "",
    projectState: formData?.projectState || "",
    projectZipCode: formData?.projectZipCode || "",
    projectCountry: formData?.projectCountry || "United States",

    // ----- files (kept as-is) -----
    propertyBoundarySurveyMap: formData?.propertyBoundarySurveyMap || null,
    geotechnicalReport: formData?.geotechnicalReport || null,
    additionalProjectPhotos: formData?.additionalProjectPhotos || [],
  });

  /* ------------------------------------------------------------------ */
  /* 2. “Same as mailing address” logic                                   */
  /* ------------------------------------------------------------------ */
  const [sameAsMailingAddress, setSameAsMailingAddress] = useState(false);

  const copyMailingToProject = () => {
    setLocalFormData((prev) => ({
      ...prev,
      projectStreetAddress: formData.address || "",
      projectCity: formData.city || "",
      projectState: formData.state || "",
      projectZipCode: formData.zipCode || "",
      projectCountry: formData.country || "United States",
    }));
  };

  const handleSameAsMailingAddressChange = (checked: boolean) => {
    setSameAsMailingAddress(checked);
    if (checked) copyMailingToProject();
  };

  /* ------------------------------------------------------------------ */
  /* 3. Dynamic state / city fetching                                    */
  /* ------------------------------------------------------------------ */
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedCountry = localFormData.projectCountry;

  // ---- fetch states ---------------------------------------------------
  useEffect(() => {
    async function fetchStates() {
      if (!selectedCountry) return;
      setLoadingStates(true);
      setStates([]);
      setCities([]);
      setLocalFormData((p) => ({ ...p, projectState: "", projectCity: "" }));

      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry }),
          }
        );
        const data = await res.json();
        if (data?.data?.states) {
          setStates(data.data.states.map((s: any) => s.name));
        }
      } catch (err) {
        console.error("Error fetching states:", err);
      } finally {
        setLoadingStates(false);
      }
    }

    fetchStates();
  }, [selectedCountry]);

  // ---- fetch cities ---------------------------------------------------
  useEffect(() => {
    async function fetchCities() {
      if (!selectedCountry || !localFormData.projectState) return;
      setLoadingCities(true);
      setLocalFormData((p) => ({ ...p, projectCity: "" }));

      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/state/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              country: selectedCountry,
              state: localFormData.projectState,
            }),
          }
        );
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          setCities(data.data);
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
      } finally {
        setLoadingCities(false);
      }
    }

    fetchCities();
  }, [localFormData.projectState, selectedCountry]);

  /* ------------------------------------------------------------------ */
  /* 4. Generic change handlers                                          */
  /* ------------------------------------------------------------------ */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files) return;

    if (name === "additionalProjectPhotos") {
      setLocalFormData((prev) => ({
        ...prev,
        [name]: Array.from(files),
      }));
    } else {
      setLocalFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  /* ------------------------------------------------------------------ */
  /* 5. Navigation                                                       */
  /* ------------------------------------------------------------------ */
  const goNext = () => {
    updateFormData(localFormData); // push everything to parent
    goToNextSection();
  };

  const goPrev = () => {
    updateFormData(localFormData);
    goToPreviousSection();
  };

  /* ------------------------------------------------------------------ */
  /* 6. Render                                                           */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-6 pb-6">
      {/* --------------------------------------------------- Project Name */}
      <div>
        <h2 className="text-base font-medium mb-4">Project Name</h2>
        <Label htmlFor="projectName" className="text-xs font-normal">
          Name
        </Label>
        <Input
          id="projectName"
          name="projectName"
          value={localFormData.projectName}
          onChange={handleInputChange}
          className="mt-1"
          required
        />
      </div>

      {/* --------------------------------------------------- Project Location */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">Project Location</h2>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsMailingAddress"
              checked={sameAsMailingAddress}
              onCheckedChange={(c) =>
                handleSameAsMailingAddressChange(c as boolean)
              }
            />
            <Label htmlFor="sameAsMailingAddress" className="text-sm">
              Same as mailing address
            </Label>
          </div>
        </div>

        {/* ----- Country ----- */}
        <div className="space-y-2">
          <Label htmlFor="projectCountry" className="text-xs font-normal">
            Country
          </Label>
          <Select
            value={localFormData.projectCountry}
            onValueChange={(v) => handleSelectChange("projectCountry", v)}
            disabled={sameAsMailingAddress}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-white">
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* ----- State ----- */}
        <div className="mt-4">
          <Label htmlFor="projectState" className="text-xs font-normal">
            State / Province
          </Label>
          {loadingStates ? (
            <p className="text-sm text-gray-500">Loading states…</p>
          ) : states.length > 0 ? (
            <Select
              value={localFormData.projectState}
              onValueChange={(v) => handleSelectChange("projectState", v)}
              disabled={sameAsMailingAddress}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px]">
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="projectState"
              name="projectState"
              value={localFormData.projectState}
              onChange={handleInputChange}
              placeholder="Enter state or province"
              className="mt-1"
              disabled={sameAsMailingAddress}
            />
          )}
        </div>

        {/* ----- City ----- */}
        <div className="mt-4">
          <Label htmlFor="projectCity" className="text-xs font-normal">
            City
          </Label>
          {loadingCities ? (
            <p className="text-sm text-gray-500">Loading cities…</p>
          ) : cities.length > 0 ? (
            <Select
              value={localFormData.projectCity}
              onValueChange={(v) => handleSelectChange("projectCity", v)}
              disabled={sameAsMailingAddress}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px]">
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="projectCity"
              name="projectCity"
              value={localFormData.projectCity}
              onChange={handleInputChange}
              placeholder="Enter city"
              className="mt-1"
              disabled={sameAsMailingAddress}
            />
          )}
        </div>

        {/* ----- Street Address ----- */}
        <div className="mt-4">
          <Label htmlFor="projectStreetAddress" className="text-xs font-normal">
            Street Address
          </Label>
          <Input
            id="projectStreetAddress"
            name="projectStreetAddress"
            value={localFormData.projectStreetAddress}
            onChange={handleInputChange}
            className="mt-1"
            required
            disabled={sameAsMailingAddress}
          />
        </div>

        {/* ----- Zip Code ----- */}
        <div className="mt-4">
          <Label htmlFor="projectZipCode" className="text-xs font-normal">
            Zip Code
          </Label>
          <Input
            id="projectZipCode"
            name="projectZipCode"
            value={localFormData.projectZipCode}
            onChange={handleInputChange}
            className="mt-1"
            required
            disabled={sameAsMailingAddress}
          />
        </div>
      </div>

      {/* --------------------------------------------------- Project Specifications */}
      <div>
        <h2 className="text-base font-medium mb-4">Project Specifications</h2>
        <div className="space-y-4">
          {/* ---- Service Type + optional “Other” input ---- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType" className="text-xs font-normal">
                Service Type
              </Label>

              <Select
                value={localFormData.serviceType}
                onValueChange={(v) => handleSelectChange("serviceType", v)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="new-construction">
                    New Construction
                  </SelectItem>
                  <SelectItem value="renovation">
                    Renovation / Remodel
                  </SelectItem>
                  <SelectItem value="addition">Tenant Improvement</SelectItem>
                  <SelectItem value="consultation">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Show input only when “Other” is selected */}
              {localFormData.serviceType === "consultation" && (
                <Input
                  name="serviceTypeOther"
                  placeholder="Please specify…"
                  value={localFormData.serviceTypeOther ?? ""}
                  onChange={handleInputChange}
                  className="mt-2"
                />
              )}
            </div>

            {/* ---- Project Type + optional “Other” input ---- */}
            <div className="space-y-2">
              <Label htmlFor="projectType" className="text-xs font-normal">
                Project Type
              </Label>

              <Select
                value={localFormData.projectType}
                onValueChange={(v) => handleSelectChange("projectType", v)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Show input only when “Other” is selected */}
              {localFormData.projectType === "other" && (
                <Input
                  name="projectTypeOther"
                  placeholder="Please specify…"
                  value={localFormData.projectTypeOther ?? ""}
                  onChange={handleInputChange}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* ---- Square Footage ---- */}
          <div>
            <Label htmlFor="squareFootage" className="text-xs font-normal">
              Project Size
            </Label>
            <Input
              id="squareFootage"
              name="squareFootage"
              type="number"
              value={localFormData.squareFootage}
              onChange={handleInputChange}
              className="mt-1"
              required
            />
          </div>

          {/* budget range  */}
          <div>
            <Label htmlFor="budgetRange" className="text-xs font-normal">
              Budget Range
            </Label>
            <Select
              value={localFormData.budgetRange}
              onValueChange={(v) => handleSelectChange("budgetRange", v)}
            >
              <SelectTrigger className="mt-1 w-full">
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

      {/* --------------------------------------------------- Timeline & Budget */}
      {/* <div>
        <h2 className="text-base font-medium mb-4">
          Project Timeline and Budget
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectTimeline" className="text-xs font-normal">
              Expected Project Timeline
            </Label>
            <Select
              value={localFormData.projectTimeline}
              onValueChange={(v) => handleSelectChange("projectTimeline", v)}
            >
              <SelectTrigger className="mt-1 w-full">
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
              value={localFormData.budgetRange}
              onValueChange={(v) => handleSelectChange("budgetRange", v)}
            >
              <SelectTrigger className="mt-1 w-full">
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
      </div> */}

      {/* --------------------------------------------------- Architectural Preferences */}
      <div>
        <h2 className="text-base font-medium mb-4">
          Architectural Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="architecturalStyle" className="text-xs font-normal">
              Preferred Architectural Style
            </Label>
            <Textarea
              id="architecturalStyle"
              name="architecturalStyle"
              value={localFormData.architecturalStyle}
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
              value={localFormData.siteConstraints}
              onChange={handleInputChange}
              className="mt-1"
              placeholder="e.g., Sloped terrain, flood zone, etc."
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- Sustainability & Special */}
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
              value={localFormData.sustainabilityGoals}
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
              value={localFormData.specialRequirements}
              onChange={handleInputChange}
              className="mt-1"
              placeholder="e.g., ADA compliance, home office, etc."
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- Required Documents */}
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
                onChange={handleFileChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label
                htmlFor="geotechnicalReport"
                className="text-xs font-normal"
              >
                Geotechnical Report/Survey
              </Label>
              <Input
                id="geotechnicalReport"
                name="geotechnicalReport"
                type="file"
                onChange={handleFileChange}
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
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          className="cursor-pointer border-2 border-black hover:bg-gray-600 hover:border-gray-600 hover:text-white"
        >
          Previous
        </Button>

        <Button
          type="button"
          onClick={goNext}
          className="cursor-pointer border-2 border-black hover:bg-gray-600 hover:border-gray-600 hover:text-white"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
