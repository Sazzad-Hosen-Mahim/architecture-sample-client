/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import ThumbprintButton from "../ThumbprintButton";
import { countries } from "@/data/countries-states";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FieldError from "../FieldError";
import {
  validateClientInfo,
  hasErrors,
  type ValidationErrors,
} from "@/utils/newProjectValidation";
import { toast } from "sonner";

interface ClientInfoSectionProps {
  formData: any;
  updateFormData: (data: any) => void;
  goToNextSection: () => void;
  goToPreviousSection: () => void; // <-- added
}

export default function ClientInfoSection({
  formData,
  updateFormData,
  goToNextSection,
  goToPreviousSection,
}: ClientInfoSectionProps) {
  const [localFormData, setLocalFormData] = useState({
    firstName: formData?.firstName || "",
    middleInitial: formData?.middleInitial || "",
    lastName: formData?.lastName || "",
    companyName: formData?.companyName || "",
    email: formData?.email || "",
    phone: formData?.phone || "",
    address: formData?.address || "",
    aptSuiteUnit: formData?.aptSuiteUnit || "",
    city: formData?.city || "",
    state: formData?.state || "",
    zipCode: formData?.zipCode || "",
    country: formData?.country || "United States",
    additionalComments: formData?.additionalComments || "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedCountry = localFormData.country;
  // const selectedCountryCode =
  //   countries.find((c) => c.name === selectedCountry)?.code || "";

  // 🆕 Fetch states dynamically when country changes
  useEffect(() => {
    async function fetchStates() {
      if (!selectedCountry) return;
      setLoadingStates(true);
      setStates([]);
      setCities([]);

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

  // 🆕 Fetch cities when state changes
  useEffect(() => {
    async function fetchCities() {
      if (!selectedCountry || !localFormData.state) return;
      setLoadingCities(true);
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/state/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              country: selectedCountry,
              state: localFormData.state,
            }),
          },
        );
        const data = await res.json();
        if (data?.data?.length) {
          setCities(data.data);
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
      } finally {
        setLoadingCities(false);
      }
    }

    fetchCities();
  }, [localFormData.state, selectedCountry]);

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
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleNext = () => {
    const validationErrors = validateClientInfo(localFormData);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast.error("Please fill in all required fields before continuing.");
      return;
    }

    updateFormData(localFormData);
    goToNextSection();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNext();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <Label className="font-semibold mb-6">Client Information</Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={localFormData.firstName}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleInitial"
              name="middleInitial"
              value={localFormData.middleInitial}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={localFormData.lastName}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.lastName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name (optional)</Label>
            <Input
              id="companyName"
              name="companyName"
              value={localFormData.companyName}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={localFormData.email}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={localFormData.phone}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.phone} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="font-semibold my-7">
            Client Contact Address
          </Label>
          <div className="space-y-2">
            <Label htmlFor="address">
              Street Address{" "}
              <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="address"
              name="address"
              value={localFormData.address}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.address} />
          </div>
          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">
              Country <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Select
              value={localFormData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-white border-gray-300">
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  {countries.map((country) => (
                    <SelectItem
                      key={country.code}
                      value={country.name}
                      className="hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError message={errors.country} />
          </div>
        </div>

        {/* Province */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">
              State / Province{" "}
              <span className="text-red-500 font-semibold">*</span>
            </Label>
            {loadingStates ? (
              <p className="text-sm text-gray-500">Loading states...</p>
            ) : states.length > 0 ? (
              <Select
                value={localFormData.state}
                onValueChange={(value) => handleSelectChange("state", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px] border-gray-300">
                  {states.map((state) => (
                    <SelectItem
                      key={state}
                      value={state}
                      className="hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="state"
                name="state"
                value={localFormData.state}
                onChange={handleInputChange}
                placeholder="Enter state or province"
              />
            )}
            <FieldError message={errors.state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">
              Zip Code / Postal code{" "}
              <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={localFormData.zipCode}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.zipCode} />
          </div>
        </div>

        {/* 🆕 Dynamic City Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              {loadingCities ? (
                <p className="text-sm text-gray-500">Loading cities...</p>
              ) : cities.length > 0 ? (
                <Select
                  value={localFormData.city}
                  onValueChange={(value) => handleSelectChange("city", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[300px] border-gray-300">
                    {cities.map((city) => (
                      <SelectItem
                        key={city}
                        value={city}
                        className="hover:bg-gray-800 hover:text-white cursor-pointer"
                      >
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="city"
                  name="city"
                  value={localFormData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              )}
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <Label htmlFor="aptSuiteUnit">
                Apt / Suite / Unit (Optional)
              </Label>
              <Input
                id="aptSuiteUnit"
                name="aptSuiteUnit"
                value={localFormData.aptSuiteUnit}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <Textarea
          id="projectDescription"
          name="additionalComments"
          placeholder="Additional Comments"
          value={localFormData.additionalComments}
          onChange={handleInputChange}
          rows={4}
        />
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              updateFormData(localFormData); // save current form data
              goToPreviousSection();
            }}
          >
            Previous
          </Button>
          <h1 className="text-sm text-red-500">* - indicates required field</h1>
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
      </form>
    </div>
  );
}
