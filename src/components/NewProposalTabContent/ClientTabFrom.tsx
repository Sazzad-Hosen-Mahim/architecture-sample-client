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

interface ClientFormProps {
  clientInfo: {
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    state: string;
    zip: string;
    additionalNotes?: string;
  };
  handleClientInfoChange: (field: string, value: string) => void;
  handleNext: () => void;
}

export default function ClientTabFrom({
  clientInfo,
  handleClientInfoChange,
  handleNext,
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
      <div className="mb-6">
        <Label htmlFor="address" className="mb-3">
          Street Address
        </Label>
        <Input
          id="address"
          value={clientInfo.address}
          onChange={(e) => handleClientInfoChange("address", e.target.value)}
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={clientInfo.city}
            onChange={(e) => handleClientInfoChange("city", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={clientInfo.country}
            onValueChange={(value) => handleClientInfoChange("country", value)}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="Mexico">Mexico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={clientInfo.state}
            onValueChange={(value) => handleClientInfoChange("state", value)}
          >
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CA">California</SelectItem>
              <SelectItem value="NY">New York</SelectItem>
              <SelectItem value="TX">Texas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="zip">ZIP</Label>
          <Input
            id="zip"
            value={clientInfo.zip}
            onChange={(e) => handleClientInfoChange("zip", e.target.value)}
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
          className="bg-gray-800 text-white hover:bg-black cursor-pointer"
        >
          Continue to Project
        </Button>
      </div>
    </div>
  );
}
