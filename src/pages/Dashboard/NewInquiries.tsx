import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import ClientTabFrom from "@/components/NewProposalTabContent/ClientTabFrom";
import {
  useCreateNewInquiryMutation,
  useLazyCheckEmailExistsQuery,
} from "@/redux/api/newInquiryApi";
import FieldError from "@/components/New project/FieldError";
import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "@/components/Common/LocationSelects";

/**
 * The stored budget is a display string — "$250,000 USD" — matching what the
 * client-facing New Project wizard submits, so an inquiry raised here and one
 * raised by a client land in the same shape.
 */
const formatBudget = (digits: string, currency: string) =>
  digits ? `$${Number(digits).toLocaleString("en-US")} ${currency}` : "";

export interface NewInquiryPageProps {
  projectData?: any;
  onProposalCreated?: (proposalData: any) => void;
}

export default function NewInquiryPage({}: NewInquiryPageProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<"client" | "project">("client");
  const [progress, setProgress] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [createNewInquiry, { isLoading: isSubmitting }] =
    useCreateNewInquiryMutation();
  const [checkEmailExists, { isFetching: isCheckingEmail }] =
    useLazyCheckEmailExistsQuery();

  // Form state
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    aptSuiteUnit: "",
    state: "",
    zip: "",
    country: "United States",
    additionalNotes: "",
  });

  const [projectInfo, setProjectInfo] = useState({
    projectName: "",
    projectDescription: "",
    additionalContext: "",
    streetAddress: "",
    aptSuiteUnit: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    sameAsMailingAddress: false,
    serviceType: "new-construction",
    serviceTypeOther: "",
    projectType: "",
    projectTypeOther: "",
    squareFootage: "",
    projectSizeUnit: "sqf",
    budgetRange: "",
    // Held alongside the amount so the formatted `budgetRange` string can be
    // rebuilt when either half changes. Only `budgetRange` is submitted.
    budgetCurrency: "USD",
    googleDriveLink: "",
  });

  const handleClientInfoChange = (field: string, value: string) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProjectInfoChange = (field: string, value: string | boolean) => {
    setProjectInfo((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // "Same as mailing address" mirrors the client's address into the project
  // address fields (and the form disables them while it's ticked). The effect
  // below keeps them in sync if the client address is edited afterwards.
  const handleSameAsMailingChange = (checked: boolean) => {
    setProjectInfo((prev) => ({ ...prev, sameAsMailingAddress: checked }));
    if (checked) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.streetAddress;
        delete next.city;
        delete next.state;
        delete next.zip;
        return next;
      });
    }
  };

  useEffect(() => {
    if (!projectInfo.sameAsMailingAddress) return;
    setProjectInfo((prev) => ({
      ...prev,
      streetAddress: clientInfo.address,
      aptSuiteUnit: clientInfo.aptSuiteUnit,
      city: clientInfo.city,
      state: clientInfo.state,
      zip: clientInfo.zip,
      country: clientInfo.country,
    }));
  }, [
    projectInfo.sameAsMailingAddress,
    clientInfo.address,
    clientInfo.aptSuiteUnit,
    clientInfo.city,
    clientInfo.state,
    clientInfo.zip,
    clientInfo.country,
  ]);

  const handleNext = async () => {
    if (activeStep === "client") {
      // Validate required client fields
      if (
        !clientInfo.firstName.trim() ||
        !clientInfo.lastName.trim() ||
        !clientInfo.email.trim()
      ) {
        toast.error("Please fill in First Name, Last Name, and Email");
        return;
      }
      setActiveStep("project");
      setProgress(50);
    } else if (activeStep === "project") {
      // Validate required project fields
      const projectErrors: Record<string, string> = {};
      if (!projectInfo.projectName.trim()) {
        projectErrors.projectName = "Project name is required";
      }
      // An "Other" choice is meaningless without the free text behind it
      if (
        projectInfo.serviceType === "consultation" &&
        !projectInfo.serviceTypeOther.trim()
      ) {
        projectErrors.serviceTypeOther = "Please specify the service type";
      }
      if (
        projectInfo.projectType === "other" &&
        !projectInfo.projectTypeOther.trim()
      ) {
        projectErrors.projectTypeOther = "Please specify the project type";
      }

      setErrors(projectErrors);
      if (Object.keys(projectErrors).length > 0) {
        toast.error("Please complete the highlighted fields");
        return;
      }

      setProgress(100);

      // If the client already has an account with credentials, there's no
      // password to set — submit directly instead of prompting.
      try {
        const result = await checkEmailExists(clientInfo.email.trim()).unwrap();
        if (!result.needsPassword) {
          await submitInquiry();
          return;
        }
      } catch {
        // Fall through to the password step as a safe default.
      }

      setShowPasswordModal(true);
    }
  };

  const handleBack = () => {
    if (activeStep === "project") {
      setActiveStep("client");
      setProgress(0);
    }
  };

  const submitInquiry = async (passwordToSend?: string) => {
    try {
      const response = await createNewInquiry({
        clientInfo: {
          firstName: clientInfo.firstName.trim(),
          lastName: clientInfo.lastName.trim(),
          companyName: clientInfo.companyName?.trim() || undefined,
          email: clientInfo.email.trim(),
          phone: clientInfo.phone?.trim() || undefined,
          address: clientInfo.address?.trim() || undefined,
          aptSuiteUnit: clientInfo.aptSuiteUnit?.trim() || undefined,
          city: clientInfo.city?.trim() || undefined,
          state: clientInfo.state?.trim() || undefined,
          zip: clientInfo.zip?.trim() || undefined,
          country: clientInfo.country?.trim() || undefined,
          additionalNotes: clientInfo.additionalNotes?.trim() || undefined,
        },
        projectInfo: {
          projectName: projectInfo.projectName,
          projectDescription: projectInfo.projectDescription || undefined,
          additionalContext: projectInfo.additionalContext || undefined,
          streetAddress: projectInfo.streetAddress || undefined,
          aptSuiteUnit: projectInfo.aptSuiteUnit || undefined,
          city: projectInfo.city || undefined,
          state: projectInfo.state || undefined,
          zip: projectInfo.zip || undefined,
          country: projectInfo.country || undefined,
          sameAsMailingAddress: projectInfo.sameAsMailingAddress,
          serviceType: projectInfo.serviceType || undefined,
          // Free text only means something behind the "Other" options
          serviceTypeOther:
            projectInfo.serviceType === "consultation"
              ? projectInfo.serviceTypeOther?.trim() || undefined
              : undefined,
          projectType: projectInfo.projectType || undefined,
          projectTypeOther:
            projectInfo.projectType === "other"
              ? projectInfo.projectTypeOther?.trim() || undefined
              : undefined,
          squareFootage: projectInfo.squareFootage
            ? `${Number(String(projectInfo.squareFootage).replace(/[^\d]/g, "")).toLocaleString("en-US")} ${projectInfo.projectSizeUnit === "sqm" ? "sq m" : "sq ft"}`
            : undefined,
          budgetRange: projectInfo.budgetRange || undefined,
        },
        password: passwordToSend,
      }).unwrap();

      toast.success(
        response?.message ||
          (passwordToSend
            ? "New inquiry created successfully! Client account has been set up."
            : "New inquiry created successfully and linked to the client's existing account."),
      );
      setShowPasswordModal(false);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to create new inquiry:", error);
      toast.error(error?.data?.message || "Failed to create new inquiry");
    }
  };

  const handleSubmitInquiry = async () => {
    // Validate passwords
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    await submitInquiry(password);
  };

  return (
    <div className="min-h-screen bg-white ">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 ">
        <div className="  py-4 px-20 flex items-center border-b border-gray-300">
          <Link
            to="/dashboard"
            className="mr-4 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 " />
            <h1 className="text-xs font-semibold">Back To Dashboard</h1>
          </Link>
        </div>
      </header>

      {/* Progress Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-2 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 overflow-x-auto md:overflow-x-visible">
              <Button
                variant={activeStep === "client" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveStep("client")}
              >
                <FileText className="h-4 w-4 mr-2" />
                New Inquiry
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Inquiry Journey</span>
            <span className="text-sm text-gray-500">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-800 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <div
              className={`flex flex-col items-center ${
                activeStep === "client" ? "text-gray-800 font-semibold" : ""
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  activeStep === "client" ? "bg-gray-800" : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs mt-1">Client</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                activeStep === "project" ? "text-gray-800 font-semibold" : ""
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  activeStep === "project"
                    ? "bg-gray-800"
                    : progress >= 50
                      ? "bg-gray-800"
                      : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs mt-1">Project</span>
            </div>
          </div>
        </div>

        {/* Client Information Step */}
        {activeStep === "client" && (
          <ClientTabFrom
            clientInfo={clientInfo}
            handleClientInfoChange={handleClientInfoChange}
            handleNext={handleNext}
          />
        )}

        {/* Project Information Step - with custom submit button */}
        {activeStep === "project" && (
          <ProjectTabFormForInquiry
            projectInfo={projectInfo}
            handleProjectInfoChange={handleProjectInfoChange}
            onSameAsMailingChange={handleSameAsMailingChange}
            handleNext={handleNext}
            handleBack={handleBack}
            isSubmitting={isCheckingEmail || isSubmitting}
            errors={errors}
          />
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Set Client Password
                  </h3>
                  <p className="text-gray-300 text-sm mt-0.5">
                    The client will use this password to log in
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Client Email:</span>{" "}
                  {clientInfo.email}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  The client can log in using this email and the password you
                  set below.
                </p>
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 characters)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setProgress(50);
                }}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitInquiry}
                disabled={
                  isSubmitting ||
                  !password ||
                  password.length < 6 ||
                  password !== confirmPassword
                }
                className="bg-gray-800 text-white hover:bg-black cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Inquiry & Account"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom ProjectTabForm that shows "Submit" instead of "Continue to Services"
function ProjectTabFormForInquiry({
  projectInfo,
  handleProjectInfoChange,
  onSameAsMailingChange,
  handleNext,
  handleBack,
  isSubmitting,
  errors,
}: {
  projectInfo: any;
  handleProjectInfoChange: (field: string, value: string | boolean) => void;
  onSameAsMailingChange: (checked: boolean) => void;
  handleNext: () => void;
  handleBack: () => void;
  isSubmitting?: boolean;
  errors: Record<string, string>;
}) {
  const sameAsMailing = projectInfo.sameAsMailingAddress;

  // The field holds a formatted string; the input works in bare digits and is
  // re-grouped on the way back out, so typing never fights the formatting.
  const budgetDigits = String(projectInfo.budgetRange || "").replace(
    /[^\d]/g,
    "",
  );

  const handleBudgetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    handleProjectInfoChange(
      "budgetRange",
      formatBudget(digits, projectInfo.budgetCurrency || "USD"),
    );
  };

  // Same trick for project size: stored bare, rendered grouped.
  const squareFootageDigits = String(projectInfo.squareFootage || "").replace(
    /[^\d]/g,
    "",
  );

  const handleSquareFootageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    handleProjectInfoChange(
      "squareFootage",
      e.target.value.replace(/[^\d]/g, ""),
    );
  };

  const handleBudgetCurrencyChange = (currency: string) => {
    handleProjectInfoChange("budgetCurrency", currency);
    handleProjectInfoChange(
      "budgetRange",
      formatBudget(budgetDigits, currency),
    );
  };

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold border-l-4 border-blue-600 pl-3">
          Project Information
        </h2>
        <p className="text-sm text-red-500 mb-3">* indicates required field</p>
      </div>

      {/* Project Name */}
      <div className="mb-6">
        <Label htmlFor="projectName" className="mb-3">
          Project Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="projectName"
          value={projectInfo.projectName}
          onChange={(e: any) =>
            handleProjectInfoChange("projectName", e.target.value)
          }
        />
        <FieldError message={errors.projectName} />
      </div>

      {/* Project Description */}
      <div className="mb-4">
        <Label htmlFor="projectDescription" className="mb-3">
          Project Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="projectDescription"
          rows={4}
          value={projectInfo.projectDescription}
          placeholder="Describe the project scope, purpose, and goals"
          onChange={(e: any) =>
            handleProjectInfoChange("projectDescription", e.target.value)
          }
        />
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
          onChange={(e: any) =>
            handleProjectInfoChange("additionalContext", e.target.value)
          }
        />
      </div>

      {/* Project Location */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="projectLocation">
            Project Location <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsMailingAddress"
              checked={sameAsMailing}
              onCheckedChange={(checked: any) =>
                onSameAsMailingChange(checked === true)
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

        <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
          <div className="w-full space-y-2">
            <Label htmlFor="streetAddress">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="streetAddress"
              value={projectInfo.streetAddress}
              disabled={sameAsMailing}
              onChange={(e: any) =>
                handleProjectInfoChange("streetAddress", e.target.value)
              }
            />
          </div>
          <div className="space-y-2 w-full">
            <Label htmlFor="aptSuiteUnit">Apt / Suite / Unit</Label>
            <Input
              id="aptSuiteUnit"
              name="aptSuiteUnit"
              value={projectInfo.aptSuiteUnit}
              disabled={sameAsMailing}
              onChange={(e: any) =>
                handleProjectInfoChange("aptSuiteUnit", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectCountry">
              Country <span className="text-red-500">*</span>
            </Label>
            <CountrySelect
              id="projectCountry"
              value={projectInfo.country}
              disabled={sameAsMailing}
              onChange={(value) => {
                handleProjectInfoChange("country", value);
                handleProjectInfoChange("state", "");
                handleProjectInfoChange("city", "");
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectState">
              State <span className="text-red-500">*</span>
            </Label>
            <StateSelect
              id="projectState"
              country={projectInfo.country}
              value={projectInfo.state}
              disabled={sameAsMailing}
              onChange={(value) => {
                handleProjectInfoChange("state", value);
                handleProjectInfoChange("city", "");
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectCity">
              City <span className="text-red-500">*</span>
            </Label>
            <CitySelect
              id="projectCity"
              country={projectInfo.country}
              state={projectInfo.state}
              value={projectInfo.city}
              disabled={sameAsMailing}
              onChange={(value) => handleProjectInfoChange("city", value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectZip">
              Zip Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="projectZip"
              value={projectInfo.zip}
              disabled={sameAsMailing}
              onChange={(e: any) =>
                handleProjectInfoChange("zip", e.target.value)
              }
              placeholder="Enter zip / postal code"
            />
          </div>
        </div>
      </div>

      {/* Project Specifications */}
      <h3 className="font-medium text-sm py-4 mb-3">Project Specifications</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="serviceType">
            Service Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={projectInfo.serviceType}
            onValueChange={(value: any) =>
              handleProjectInfoChange("serviceType", value)
            }
          >
            <SelectTrigger id="serviceType" className="w-full">
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
          {projectInfo.serviceType === "consultation" && (
            <>
              <Input
                id="serviceTypeOther"
                placeholder="Please specify…"
                value={projectInfo.serviceTypeOther ?? ""}
                onChange={(e: any) =>
                  handleProjectInfoChange("serviceTypeOther", e.target.value)
                }
                className="mt-2"
              />
              <FieldError message={errors.serviceTypeOther} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="projectType">
            Project Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={projectInfo.projectType}
            onValueChange={(value: any) =>
              handleProjectInfoChange("projectType", value)
            }
          >
            <SelectTrigger id="projectType" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent className="bg-white border border-gray-300">
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
          {projectInfo.projectType === "other" && (
            <>
              <Input
                id="projectTypeOther"
                placeholder="Please specify…"
                value={projectInfo.projectTypeOther ?? ""}
                onChange={(e: any) =>
                  handleProjectInfoChange("projectTypeOther", e.target.value)
                }
                className="mt-2"
              />
              <FieldError message={errors.projectTypeOther} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="squareFootage">
            Project Size (Estimate) <span className="text-red-500">*</span>
          </Label>
          <div className="flex justify-center items-center w-full">
            <Input
              id="squareFootage"
              inputMode="numeric"
              value={
                squareFootageDigits
                  ? Number(squareFootageDigits).toLocaleString("en-US")
                  : ""
              }
              onChange={handleSquareFootageChange}
              placeholder="2,500"
              className="flex-1 border-r-0 rounded-r-none"
            />
            <div>
              <Select
                value={projectInfo.projectSizeUnit || "sqf"}
                onValueChange={(v: any) =>
                  handleProjectInfoChange("projectSizeUnit", v)
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
        </div>

        {/* Budget range  */}
        <div>
          <Label className="mb-2" htmlFor="budgetRange">
            Budget Range <span className="text-red-500 font-semibold">*</span>
          </Label>
          <div className="mt-1 flex">
            <Select
              value={projectInfo.budgetCurrency || "USD"}
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
            Note: This is a budget estimate for the entire project, not just the
            design package.
          </p>
        </div>
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
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-gray-800 text-white hover:bg-black cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}
