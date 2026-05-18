import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProjectRequestMutation } from "@/redux/api/newProjectAPi";
import { buildProjectPayload } from "@/utils/projectPayload";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeConsultationForm from "../StripeConsultationForm";
import { useCreateConsultationIntentMutation } from "@/redux/api/paymentApi";

const stripePromise = loadStripe("pk_test_51TVdfBBWI93tV1QCki5PX3VSlmoRzRwyO5qWwvO9zFL13niyNZTqv5ZBPi8vVCHnGNWeCDY2RVFl2oJgbdPMRc0Q00jlx3EsiG");

export default function ReviewConfirmSection({
  formData,
  updateFormData,
  onPaymentSuccess,
}: any) {
  const [createProject, { isLoading }] = useCreateProjectRequestMutation();
  const [createIntent, { isLoading: isCreatingIntent }] = useCreateConsultationIntentMutation();
  const [, setError] = useState<string | null>(null);
  console.log("formData in ReviewConfirmSection:", formData);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>({
    paymentMethod: "",
    amount: 250,
  });

  const handlePaymentMethodChange = async (value: string) => {
    setPaymentMethod(value);
    setPaymentDetails((prev: any) => ({ ...prev, paymentMethod: value }));
    updateFormData({ paymentMethod: value });

    if (value === "stripe" && !paymentIntentId) {
      try {
        const result = await createIntent({}).unwrap();
        setClientSecret(result.data.clientSecret);
      } catch (err) {
        toast.error("Failed to initialize payment. Please try again.");
      }
    }
  };

  const handlePaymentSuccess = (id: string) => {
    setPaymentIntentId(id);
    updateFormData({ paymentIntentId: id });
  };

  const [errors] = useState<any[]>([]);

  const getErrorMessage = (field: string): string => {
    const foundError = errors.find((e: any) => e.field === field);
    return foundError ? foundError.message : "";
  };

  const handleSubmit = async () => {
    if (!paymentIntentId) {
      toast.error("Please pay the consultation fee before submitting.");
      return;
    }

    try {
      const basePayload = buildProjectPayload(formData);
      const payload = {
        ...basePayload,
        paymentIntentId: paymentIntentId,
      };

      await createProject(payload).unwrap();
      toast.success("Project request submitted successfully");
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      setError(err?.data?.message || "Failed to submit project request");
      toast.error(err?.data?.message || "Failed to submit project request");
      console.error(err);
    }
  };

  return (
    <div>
      <div className="space-y-12">
        <div>
          <h2 className="text-base font-medium mb-6">Client Information</h2>
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium">Name:</span>{" "}
              {formData.firstName || "Client name"} {formData.middleInitial}{" "}
              {formData.lastName}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span>{" "}
              {formData.email || "Client@email.com"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Phone:</span>{" "}
              {formData.phone || "(555) 123-4567"}
            </p>
            {/* <p className="text-sm">
            <span className="font-medium">Alternate Phone:</span> {formData.alternatePhone || "N/A"}
          </p> */}
            <p className="text-sm">
              <span className="font-medium">Address:</span>{" "}
              {formData.streetAddress || "Client address"},{" "}
              {formData.city || "Client city"},{" "}
              {formData.state || "Client state"}{" "}
              {formData.zipCode || "Client zip code"},{" "}
              {formData.country || "Client country"}
            </p>
            {/* <p className="text-sm">
            <span className="font-medium">Occupation:</span>{" "}
            {formData.occupation || "N/A"}
          </p> */}
            {/* <p className="text-sm">
            <span className="font-medium">Company:</span> {formData.companyName || "N/A"}
          </p> */}
            {/* <p className="text-sm">
            <span className="font-medium">Referral Source:</span> {formData.referralSource || "N/A"}
          </p> */}
            <p className="text-sm">
              <span className="font-medium">
                Previous Projects with Architect:
              </span>{" "}
              {formData.previousProjects === "yes" ? "Yes" : "No"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Additional Comments:</span>{" "}
              {formData.additionalComments || "N/A"}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-6">Project Details</h2>
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium">Project Name:</span>{" "}
              {formData.projectName || "Project name"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Service Type:</span>{" "}
              {formData.serviceType || "Service type"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Project Type:</span>{" "}
              {formData.projectType || "Service type"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Project Size:</span>{" "}
              {formData.squareFootage || "Square footage"} sq ft
            </p>
            <p className="text-sm">
              <span className="font-medium">Project Address:</span>{" "}
              {formData.projectStreetAddress || "Project street address"},{" "}
              {formData.projectCity || "Project city"},{" "}
              {formData.projectState || "Project state"}{" "}
              {formData.projectZipCode || "Project zip code"},{" "}
              {formData.projectCountry || "Project country"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Project Timeline:</span>{" "}
              {formData.projectTimeline || "Project timeline"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Budget Range:</span>{" "}
              {formData.budgetRange || "Budget range"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Architectural Style:</span>{" "}
              {formData.architecturalStyle || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Site Constraints:</span>{" "}
              {formData.siteConstraints || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Sustainability Goals:</span>{" "}
              {formData.sustainabilityGoals || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Special Requirements:</span>{" "}
              {formData.specialRequirements || "N/A"}
            </p>
            {/* <p className="text-sm">
            <span className="font-medium">Project Description:</span>{" "}
            {formData.projectDescription}
          </p> */}
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-6">Appointment Details</h2>
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium">Date:</span>{" "}
              {formData.appointmentDate
                ? new Date(formData.appointmentDate).toDateString()
                : "Not set"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Time:</span>{" "}
              {formData.appointmentTime}
            </p>
            <p className="text-sm">
              <span className="font-medium">Appointment Type:</span>{" "}
              {formData.appointmentType}
            </p>
            <p className="text-sm">
              <span className="font-medium">Location:</span>{" "}
              {formData.meetingLocation || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Additional Notes:</span>{" "}
              {formData.appointmentNotes || "N/A"}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium mb-6">Payment</h2>
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">
                Consultation Fee: $250
              </span>
              <span className="text-lg font-semibold">
                {/* ${paymentDetails.amount.toFixed(2)} */}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              This fee will be applied to your project if you decide to move
              forward with our service.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="paymentMethod" className="text-xs">
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger
                  id="paymentMethod"
                  className={`mt-2 w-full border rounded-md ${getErrorMessage("paymentMethod")
                    ? "border-red-500"
                    : "border-gray-200"
                    }`}
                >
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="stripe" className="hover:bg-gray-100">
                    Stripe (Credit/Debit Card)
                  </SelectItem>
                  <SelectItem value="paypal" className="hover:bg-gray-100">
                    PayPal
                  </SelectItem>
                  <SelectItem value="zelle" className="hover:bg-gray-100">
                    Zelle
                  </SelectItem>
                  <SelectItem value="bitcoin" className="hover:bg-gray-100">
                    Bitcoin
                  </SelectItem>
                </SelectContent>
              </Select>
              {getErrorMessage("paymentMethod") && (
                <p className="text-xs text-red-500 mt-1">
                  {getErrorMessage("paymentMethod")}
                </p>
              )}
            </div>

            {paymentMethod === "stripe" && (
              <div className="mt-4">
                {paymentIntentId ? (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                    <h4 className="text-lg font-semibold text-green-800">Payment Successful</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Consultation fee of $250 has been paid. You can now submit your project request.
                    </p>
                    <div className="mt-4 text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-mono">
                      Ref: {paymentIntentId}
                    </div>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripeConsultationForm
                      onSuccess={handlePaymentSuccess}
                      clientEmail={formData.email}
                    />
                  </Elements>
                ) : isCreatingIntent ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-slate-50">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm text-slate-600">Initializing secure payment...</p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">
                    Please wait, initializing payment gateway...
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div>
                <Label htmlFor="paypalEmail" className="text-xs">
                  PayPal Email
                </Label>
                <Input
                  id="paypalEmail"
                  name="paypalEmail"
                  type="email"
                  placeholder="name@example.com"
                  className={`mt-2 w-full border rounded-md ${getErrorMessage("paypalEmail")
                    ? "border-red-500"
                    : "border-gray-200"
                    }`}
                  value={paymentDetails.paypalEmail || ""}
                // onChange={handleInputChange}
                />
                {getErrorMessage("paypalEmail") && (
                  <p className="text-xs text-red-500 mt-1">
                    {getErrorMessage("paypalEmail")}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === "zelle" && (
              <div>
                <Label htmlFor="zellePhone" className="text-xs">
                  Phone Number
                </Label>
                <Input
                  id="zellePhone"
                  name="zellePhone"
                  placeholder="(555) 123-4567"
                  className={`mt-2 w-full border rounded-md ${getErrorMessage("zellePhone")
                    ? "border-red-500"
                    : "border-gray-200"
                    }`}
                  value={paymentDetails.zellePhone || ""}
                // onChange={handleInputChange}
                />
                {getErrorMessage("zellePhone") && (
                  <p className="text-xs text-red-500 mt-1">
                    {getErrorMessage("zellePhone")}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === "bitcoin" && (
              <div>
                <Label htmlFor="bitcoinAddress" className="text-xs">
                  Bitcoin Address
                </Label>
                <Input
                  id="bitcoinAddress"
                  name="bitcoinAddress"
                  placeholder="Enter Bitcoin wallet address"
                  className={`mt-2 w-full border rounded-md ${getErrorMessage("bitcoinAddress")
                    ? "border-red-500"
                    : "border-gray-200"
                    }`}
                  value={paymentDetails.bitcoinAddress || ""}
                // onChange={handleInputChange}
                />
                {getErrorMessage("bitcoinAddress") && (
                  <p className="text-xs text-red-500 mt-1">
                    {getErrorMessage("bitcoinAddress")}
                  </p>
                )}
              </div>
            )}

            {/* Removed Submit Project Button */}
          </div>
        </div>
        {/* <div className="flex justify-center items-center mt-8">
          <button
            // onClick={handleThumbprintClick}
            disabled={isProcessing}
            className="w-20 h-20 sm:w-16 sm:h-22 bg-black rounded-full shadow-lg flex items-center justify-center focus:outline-none cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 relative overflow-hidden"
          >
            <div className="relative z-10">
              <svg
                viewBox="0 0 100 140"
                className="w-20 h-20 sm:w-24 sm:h-32 fill-none"
                strokeWidth="1.5"
              >
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[11px] sm:text-[11px] font-light tracking-[0.2em]"
                >
                  SUBMIT
                </text>
                <text
                  x="50"
                  y="80"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[11px] sm:text-[11px] font-light tracking-[0.2em]"
                >
                  PROJECT
                </text>
              </svg>
            </div>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </button>
        </div> */}
        <div className="flex justify-center items-center mt-12">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-black rounded-full shadow-lg flex items-center justify-center focus:outline-none cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 relative overflow-hidden"
          >
            <div className="relative z-10">
              <svg
                viewBox="0 0 100 140"
                className="w-20 h-20 sm:w-24 sm:h-32 fill-none"
                strokeWidth="1.5"
              >
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[11px] sm:text-[11px] font-light tracking-[0.2em]"
                >
                  SUBMIT
                </text>
                <text
                  x="50"
                  y="80"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[11px] sm:text-[11px] font-light tracking-[0.2em]"
                >
                  PROJECT
                </text>
              </svg>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
