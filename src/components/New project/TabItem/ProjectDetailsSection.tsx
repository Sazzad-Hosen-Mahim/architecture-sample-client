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
import ThumbprintButton from "../ThumbprintButton";
import FieldError from "../FieldError";
import {
  validateProjectDetails,
  hasErrors,
  type ValidationErrors,
} from "@/utils/newProjectValidation";
import { toast } from "sonner";

// Cache state lists by country so coming back to this step shows the dropdown
// straight away instead of flashing a text input while the API request runs.
const statesCache = new Map<string, string[]>();

const formatBudget = (digits: string, currency: string) =>
  digits ? `$${Number(digits).toLocaleString("en-US")} ${currency}` : "";

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
    projectSizeUnit: formData?.projectSizeUnit || "sqf",
    budgetCurrency: formData?.budgetCurrency || "USD",

    // ----- address fields (the ones we make dynamic) -----
    projectStreetAddress: formData?.projectStreetAddress || "",
    projectAptSuiteUnit: formData?.projectAptSuiteUnit || "",
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
  const [sameAsMailingAddress, setSameAsMailingAddress] = useState(
    formData?.projectLocationSameAsClient ?? false,
  );

  const copyMailingToProject = () => {
    setLocalFormData((prev) => ({
      ...prev,
      projectStreetAddress: formData.address || "",
      projectAptSuiteUnit: formData.aptSuiteUnit || "",
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
  const [states, setStates] = useState<string[]>(
    () => statesCache.get(formData?.projectCountry || "United States") || [],
  );
  const [loadingStates, setLoadingStates] = useState(false);

  const selectedCountry = localFormData.projectCountry;

  // ---- fetch states (cached; does NOT wipe a saved state/city on remount) ----
  useEffect(() => {
    if (!selectedCountry) return;

    const cached = statesCache.get(selectedCountry);
    if (cached) {
      setStates(cached);
      return;
    }

    let cancelled = false;
    setLoadingStates(true);
    setStates([]);

    (async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry }),
          },
        );
        const data = await res.json();
        const names: string[] =
          data?.data?.states?.map((s: any) => s.name) ?? [];
        statesCache.set(selectedCountry, names);
        if (!cancelled) setStates(names);
      } catch (err) {
        console.error("Error fetching states:", err);
      } finally {
        if (!cancelled) setLoadingStates(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  /* ------------------------------------------------------------------ */
  /* 4. Generic change handlers                                          */
  /* ------------------------------------------------------------------ */
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Clear a field's error as soon as it's edited, so the form stops nagging
  // about something the client is in the middle of fixing.
  const clearError = (name: string) =>
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Changing the country invalidates any previously picked state / city.
      if (name === "projectCountry") {
        next.projectState = "";
        next.projectCity = "";
      }
      return next;
    });
    clearError(name);
  };

  const budgetDigits = String(localFormData.budgetRange || "").replace(
    /[^\d]/g,
    "",
  );

  // Project size is stored as bare digits so validation can Number() it; the
  // input only renders it grouped, the same way the budget field reads.
  const squareFootageDigits = String(
    localFormData.squareFootage || "",
  ).replace(/[^\d]/g, "");

  const handleSquareFootageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setLocalFormData((prev) => ({ ...prev, squareFootage: digits }));
    clearError("squareFootage");
  };

  const handleBudgetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setLocalFormData((prev) => ({
      ...prev,
      budgetRange: formatBudget(digits, prev.budgetCurrency || "USD"),
    }));
    clearError("budgetRange");
  };

  const handleBudgetCurrencyChange = (currency: string) => {
    setLocalFormData((prev) => ({
      ...prev,
      budgetCurrency: currency,
      budgetRange: formatBudget(
        String(prev.budgetRange || "").replace(/[^\d]/g, ""),
        currency,
      ),
    }));
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
  // const goNext = () => {
  //   updateFormData(localFormData); // push everything to parent
  //   goToNextSection();
  // };

  const goPrev = () => {
    updateFormData({
      ...localFormData,
      projectLocationSameAsClient: sameAsMailingAddress,
    });
    goToPreviousSection();
  };

  const handleNext = () => {
    const validationErrors = validateProjectDetails(localFormData);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast.error("Please fill in all required fields before continuing.");
      return;
    }

    updateFormData({
      ...localFormData,
      projectLocationSameAsClient: sameAsMailingAddress,
    });
    goToNextSection();
  };

  /* ------------------------------------------------------------------ */
  /* 6. Render                                                           */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-6 pb-6">
      {/* --------------------------------------------------- Project Name */}
      <div>
        <h2 className="text-base font-medium mb-4">Project Name</h2>
        <Label htmlFor="projectName" className="mb-2">
          Name <span className="text-red-500 font-semibold">*</span>
        </Label>
        <Input
          id="projectName"
          name="projectName"
          value={localFormData.projectName}
          onChange={handleInputChange}
          className="mt-1"
          required
        />
        <FieldError message={errors.projectName} />
      </div>

      {/* --------------------------------------------------- Project Location */}
      <div className="space-y-3">
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

        {/* ----- Street Address ----- */}
        <div className="mt-4">
          <Label className="mb-2" htmlFor="projectStreetAddress">
            Street Address <span className="text-red-500 font-semibold">*</span>
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
          <FieldError message={errors.projectStreetAddress} />
        </div>

        {/* ----- Country ----- */}
        <div className="space-y-2">
          <Label className="mb-2" htmlFor="projectCountry">
            Country <span className="text-red-500 font-semibold">*</span>
          </Label>
          <Select
            value={localFormData.projectCountry}
            onValueChange={(v) => handleSelectChange("projectCountry", v)}
            disabled={sameAsMailingAddress}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-white border-gray-300">
              {countries.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.name}
                  className="hover:bg-gray-800 hover:text-white cursor-pointer"
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.projectCountry} />
        </div>
        {/* ----- State ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mt-4">
            <Label className="mb-2" htmlFor="projectState">
              State / Province{" "}
              <span className="text-red-500 font-semibold">*</span>
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
                <SelectContent className="bg-white max-h-[300px] border-gray-300">
                  {states.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
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
            <FieldError message={errors.projectState} />
          </div>
          <div className="mt-4">
            <Label className="mb-2" htmlFor="projectZipCode">
              Zip Code <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="projectZipCode"
              name="projectZipCode"
              value={localFormData.projectZipCode}
              onChange={handleInputChange}
              // className="mt-1"
              required
              disabled={sameAsMailingAddress}
            />
            <FieldError message={errors.projectZipCode} />
          </div>
        </div>

        {/* ----- City ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="">
            <Label className="mb-2" htmlFor="projectCity">
              City <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="projectCity"
              name="projectCity"
              value={localFormData.projectCity}
              onChange={handleInputChange}
              placeholder="Enter city"
              className="mt-1"
              disabled={sameAsMailingAddress}
            />
            <FieldError message={errors.projectCity} />
          </div>
          <div className="">
            <div>
              <Label className="mb-2" htmlFor="projectAptSuiteUnit">
                Apt / Suite / Unit (Optional)
              </Label>
              <Input
                id="projectAptSuiteUnit"
                name="projectAptSuiteUnit"
                value={localFormData.projectAptSuiteUnit}
                onChange={handleInputChange}
                disabled={sameAsMailingAddress}
              />
            </div>
          </div>
        </div>

        {/* ----- Zip Code ----- */}
      </div>

      {/* --------------------------------------------------- Project Specifications */}
      <div>
        <h2 className="text-base font-medium mb-4">Project Specifications</h2>
        <div className="space-y-4">
          {/* ---- Service Type + optional “Other” input ---- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="mb-2" htmlFor="serviceType">
                Service Type{" "}
                <span className="text-red-500 font-semibold">*</span>
              </Label>

              <Select
                value={localFormData.serviceType}
                onValueChange={(v) => handleSelectChange("serviceType", v)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem
                    value="new-construction"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    New Construction
                  </SelectItem>
                  <SelectItem
                    value="renovation"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Renovation / Remodel
                  </SelectItem>
                  <SelectItem
                    value="tenant-improvement"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Tenant Improvement
                  </SelectItem>
                  <SelectItem
                    value="addition"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Addition
                  </SelectItem>
                  <SelectItem
                    value="consultation"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>

              <FieldError message={errors.serviceType} />

              {/* Show input only when “Other” is selected */}
              {localFormData.serviceType === "consultation" && (
                <>
                  <Input
                    name="serviceTypeOther"
                    placeholder="Please specify…"
                    value={localFormData.serviceTypeOther ?? ""}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                  <FieldError message={errors.serviceTypeOther} />
                </>
              )}
            </div>

            {/* ---- Project Type + optional “Other” input ---- */}
            <div className="space-y-2">
              <Label className="mb-2" htmlFor="projectType">
                Project Type{" "}
                <span className="text-red-500 font-semibold">*</span>
              </Label>

              <Select
                value={localFormData.projectType}
                onValueChange={(v) => handleSelectChange("projectType", v)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem
                    value="residential"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Residential
                  </SelectItem>
                  <SelectItem
                    value="commercial"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Commercial
                  </SelectItem>
                  <SelectItem
                    value="other"
                    className="hover:bg-gray-800 hover:text-white cursor-pointer"
                  >
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>

              <FieldError message={errors.projectType} />

              {/* Show input only when “Other” is selected */}
              {localFormData.projectType === "other" && (
                <>
                  <Input
                    name="projectTypeOther"
                    placeholder="Please specify…"
                    value={localFormData.projectTypeOther ?? ""}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                  <FieldError message={errors.projectTypeOther} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ---- Square Footage ---- */}
            <div>
              <Label className="mb-2" htmlFor="squareFootage">
                Project Size ( Estimate ){" "}
                <span className="text-red-500 font-semibold">*</span>
              </Label>
              <div className="flex justify-center items-center w-full">
                <Input
                  id="squareFootage"
                  name="squareFootage"
                  inputMode="numeric"
                  value={
                    squareFootageDigits
                      ? Number(squareFootageDigits).toLocaleString("en-US")
                      : ""
                  }
                  onChange={handleSquareFootageChange}
                  placeholder="2,500"
                  className=" flex-1 border-r-0 rounded-r-none"
                  required
                />
                <div>
                  <Select
                    value={localFormData.projectSizeUnit}
                    onValueChange={(v) =>
                      handleSelectChange("projectSizeUnit", v)
                    }
                  >
                    <SelectTrigger className="w-full border-l-0 border-gray-300 rounded-l-none bg-gray-300">
                      <SelectValue placeholder="sf² / m²" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem
                        value="sqf"
                        className="hover:bg-gray-800 hover:text-white cursor-pointer"
                      >
                        sf²
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
              <FieldError message={errors.squareFootage} />
            </div>
            {/* budget range  */}
            <div>
              <Label className="mb-2" htmlFor="budgetRange">
                Budget Range{" "}
                <span className="text-red-500 font-semibold">*</span>
              </Label>
              <div className="mt-1 flex">
                <Select
                  value={localFormData.budgetCurrency || "USD"}
                  onValueChange={handleBudgetCurrencyChange}
                >
                  <SelectTrigger className="w-20 shrink-0 rounded-r-none border-r-0 bg-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem
                      value="USD"
                      className="hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
                      USD
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="budgetRange"
                    name="budgetRange"
                    inputMode="numeric"
                    value={
                      budgetDigits
                        ? Number(budgetDigits).toLocaleString("en-US")
                        : ""
                    }
                    onChange={handleBudgetAmountChange}
                    placeholder="250,000"
                    className="w-full rounded-l-none pl-7"
                  />
                </div>
              </div>
              <FieldError message={errors.budgetRange} />
              <p className="text-xs text-red-500 mt-1">
                Note: This is a budget estimate for the entire project, not just
                the design package.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- Architectural Preferences */}
      <div>
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-medium mb-4">
              Architectural Preferences
            </h2>

            <p className="text-red-500 text-sm font-semibold">
              * - indicates required field
            </p>
          </div>
          <div className="space-y-4">
            {/* <div>
            <Label htmlFor="architecturalStyle" >
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
          </div> */}
            <div>
              <Label htmlFor="siteConstraints">
                Site Constraints and Notes{" "}
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
      </div>

      {/* --------------------------------------------------- Sustainability & Special */}
      <div>
        <div className="space-y-2">
          <div>
            <Label htmlFor="specialRequirements">
              Additional Notes / Contextual Requirements
            </Label>
            <Textarea
              id="specialRequirements"
              name="specialRequirements"
              value={localFormData.specialRequirements}
              onChange={handleInputChange}
              className="mt-2"
              placeholder="e.g., ADA compliance, home office, etc."
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- Required Documents */}
      <div>
        <h2 className="font-bold mb-4">Additional Documents</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="propertyBoundarySurveyMap" className="mb-2">
              Property Boundary / Survey Map
            </Label>
            <Input
              id="propertyBoundarySurveyMap"
              name="propertyBoundarySurveyMap"
              type="file"
              onChange={handleFileChange}
              className="mt-1 cursor-pointer"
              required
            />
          </div>
          <div>
            <Label htmlFor="geotechnicalReport" className="mb-2">
              Geotechnical Report / Survey
            </Label>
            <Input
              id="geotechnicalReport"
              name="geotechnicalReport"
              type="file"
              onChange={handleFileChange}
              className="mt-1 cursor-pointer"
              required
            />
          </div>
          <div>
            <Label htmlFor="additionalProjectPhotos" className="mb-2">
              Project Photos
            </Label>
            <Input
              id="additionalProjectPhotos"
              name="additionalProjectPhotos"
              type="file"
              multiple
              onChange={handleFileChange}
              className="mt-1 cursor-pointer"
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

        {/* <Button
          type="button"
          onClick={goNext}
          className="cursor-pointer border-2 border-black hover:bg-gray-600 hover:border-gray-600 hover:text-white"
        >
          Next Step
        </Button> */}
      </div>

      <div className="w-full mt-10 flex justify-center items-center">
        <div className="flex justify-center mt-8">
          <ThumbprintButton
            // @ts-ignore
            type="button"
            onClick={handleNext}
            text="Next Step"
          />
        </div>
      </div>
    </div>
  );
}
