/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import ThumbprintButton from "../ThumbprintButton";
import { countries, usStates } from "@/data/countries-states";
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
    city: formData?.city || "",
    state: formData?.state || "",
    zipCode: formData?.zipCode || "",
    country: formData?.country || "United States",
    additionalComments: formData?.additionalComments || "",
  });

  const [selectedCountry, setSelectedCountry] = useState(
    localFormData.country || "United States"
  );
  const [showStateSelect, setShowStateSelect] = useState(
    selectedCountry === "United States"
  );

  useEffect(() => {
    setShowStateSelect(selectedCountry === "United States");
    if (selectedCountry !== "United States") {
      setLocalFormData((prev) => ({ ...prev, state: "" }));
    }
  }, [selectedCountry]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "country") {
      setSelectedCountry(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData(localFormData);
    goToNextSection();
  };

  const selectedCountryCode =
    countries.find((c) => c.name === selectedCountry)?.code || "";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <h2 className="text-2xl font-bold mb-6">Client Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={localFormData.firstName}
              onChange={handleInputChange}
              required
            />
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
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={localFormData.lastName}
              onChange={handleInputChange}
              required
            />
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={localFormData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={localFormData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Client Contact Address</Label>
          <div className="flex items-center gap-2">
            {selectedCountryCode && (
              <div className="flex-shrink-0 w-8 h-6 overflow-hidden rounded shadow ">
                <img
                  src={`https://flagcdn.com/w80/${selectedCountryCode.toLowerCase()}.png`}
                  alt={`${selectedCountry} flag`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <Select
              value={localFormData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
            >
              <SelectTrigger className="w-full ">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-white">
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-5 h-4 overflow-hidden rounded shadow">
                          <img
                            src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                            alt={`${country.name} flag`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            value={localFormData.address}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={localFormData.city}
              onChange={handleInputChange}
              required
            />
          </div>

          {showStateSelect ? (
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={localFormData.state}
                onValueChange={(value) => handleSelectChange("state", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className="bg-white">
                    <SelectLabel>States</SelectLabel>
                    {usStates.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                name="state"
                value={localFormData.state}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip/Postal Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={localFormData.zipCode}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <Textarea
          id="projectDescription"
          name="additionalComments"
          placeholder="write your additionalComments"
          value={localFormData.additionalComments}
          onChange={handleInputChange}
          rows={4}
        />
        <div>
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
        </div>

        <div className="w-full mt-10 flex justify-center items-center">
          <div className="flex justify-center mt-8">
            <ThumbprintButton
              // @ts-ignore
              type="button"
              onClick={() => {
                updateFormData(localFormData);
                goToNextSection();
              }}
              text="Next Step"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
