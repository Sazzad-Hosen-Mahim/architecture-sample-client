import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "@/components/Common/LocationSelects";

interface ClientFormProps {
  clientInfo: {
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone: string;
    address: string;
    aptSuiteUnit?: string;
    city: string;
    country: string;
    state: string;
    zip: string;
    additionalNotes?: string;
  };
  handleClientInfoChange: (field: string, value: string) => void;
  handleNext: () => void;
  /** Set while the client details are being saved to the project request. */
  isSaving?: boolean;
}

export default function ClientTabFrom({
  clientInfo,
  handleClientInfoChange,
  handleNext,
  isSaving,
}: ClientFormProps) {
  return (
    <div className="bg-white  ">
      <h2 className="text-sm font-semibold mb-6 border-l-4 border-gray-800 pl-3">
        Client Information
      </h2>

      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
        <div>
          <Label htmlFor="firstName" className="mb-3">
            First Name
          </Label>
          <Input
            id="firstName"
            value={clientInfo.firstName}
            onChange={(e) =>
              handleClientInfoChange("firstName", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-3">
            Last Name
          </Label>
          <Input
            id="lastName"
            value={clientInfo.lastName}
            onChange={(e) => handleClientInfoChange("lastName", e.target.value)}
          />
        </div>
      </div>

      {/* Company */}
      <div className="mb-3">
        <Label htmlFor="companyName" className="mb-3">
          Company Name (optional)
        </Label>
        <Input
          id="companyName"
          value={clientInfo.companyName}
          onChange={(e) =>
            handleClientInfoChange("companyName", e.target.value)
          }
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
        <div>
          <Label htmlFor="email" className="mb-3">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={clientInfo.email}
            onChange={(e) => handleClientInfoChange("email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-3">
            Phone
          </Label>
          <Input
            id="phone"
            value={clientInfo.phone}
            onChange={(e) => handleClientInfoChange("phone", e.target.value)}
          />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <Label htmlFor="address" className="mb-3">
            Street Address
          </Label>
          <Input
            id="address"
            value={clientInfo.address}
            onChange={(e) => handleClientInfoChange("address", e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-3">Apt/Suite/Unit (optional)</Label>
          <Input
            id="aptSuiteUnit"
            value={clientInfo.aptSuiteUnit}
            onChange={(e) =>
              handleClientInfoChange("aptSuiteUnit", e.target.value)
            }
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <CountrySelect
            id="country"
            value={clientInfo.country}
            // A new country invalidates whatever state/city was picked before.
            onChange={(value) => {
              handleClientInfoChange("country", value);
              handleClientInfoChange("state", "");
              handleClientInfoChange("city", "");
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <StateSelect
            id="state"
            country={clientInfo.country}
            value={clientInfo.state}
            onChange={(value) => {
              handleClientInfoChange("state", value);
              handleClientInfoChange("city", "");
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City</Label>
          <CitySelect
            id="city"
            country={clientInfo.country}
            state={clientInfo.state}
            value={clientInfo.city}
            onChange={(value) => handleClientInfoChange("city", value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="zip">Zip Code</Label>
          <Input
            id="zip"
            value={clientInfo.zip}
            onChange={(e) => handleClientInfoChange("zip", e.target.value)}
            placeholder="Enter zip / postal code"
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mb-3">
        <Label htmlFor="additionalNotes" className="mb-3">
          Additional Notes
        </Label>
        <Textarea
          id="additionalNotes"
          rows={4}
          value={clientInfo.additionalNotes}
          onChange={(e) =>
            handleClientInfoChange("additionalNotes", e.target.value)
          }
          placeholder="Any additional information about the client or special requirements"
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={isSaving}
          className="bg-gray-800 text-white hover:bg-black cursor-pointer"
        >
          {isSaving ? "Saving..." : "Continue to Project"}
        </Button>
      </div>
    </div>
  );
}
