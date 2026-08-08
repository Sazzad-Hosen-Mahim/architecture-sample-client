import { useState } from "react";
import { ArrowLeft, FileText, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
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
import { useCreateNewInquiryMutation, useLazyCheckEmailExistsQuery } from "@/redux/api/newInquiryApi";

export interface NewInquiryPageProps {
    projectData?: any;
    onProposalCreated?: (proposalData: any) => void;
}

export default function NewInquiryPage({
}: NewInquiryPageProps) {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState<
        "client" | "project"
    >("client");
    const [progress, setProgress] = useState(0);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [createNewInquiry, { isLoading: isSubmitting }] = useCreateNewInquiryMutation();
    const [checkEmailExists, { isFetching: isCheckingEmail }] = useLazyCheckEmailExistsQuery();

    // Form state
    const [clientInfo, setClientInfo] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
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
        city: "",
        state: "",
        zip: "",
        country: "United States",
        sameAsMailingAddress: false,
        serviceType: "New Construction",
        projectType: "",
        squareFootage: "",
        projectSizeUnit: "sqf",
        budgetRange: "",
        timeline: "",
        googleDriveLink: "",
    });

    const handleClientInfoChange = (field: string, value: string) => {
        setClientInfo((prev) => ({ ...prev, [field]: value }));
    };

    const handleProjectInfoChange = (field: string, value: string | boolean) => {
        setProjectInfo((prev) => ({ ...prev, [field]: value }));
    };

    const handleNext = async () => {
        if (activeStep === "client") {
            // Validate required client fields
            if (!clientInfo.firstName.trim() || !clientInfo.lastName.trim() || !clientInfo.email.trim()) {
                toast.error("Please fill in First Name, Last Name, and Email");
                return;
            }
            setActiveStep("project");
            setProgress(50);
        } else if (activeStep === "project") {
            // Validate required project fields
            if (!projectInfo.projectName.trim()) {
                toast.error("Please fill in the Project Name");
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
                    city: clientInfo.city?.trim() || undefined,
                    state: clientInfo.state?.trim() || undefined,
                    country: clientInfo.country?.trim() || undefined,
                    additionalNotes: clientInfo.additionalNotes?.trim() || undefined,
                },
                projectInfo: {
                    projectName: projectInfo.projectName,
                    projectDescription: projectInfo.projectDescription || undefined,
                    additionalContext: projectInfo.additionalContext || undefined,
                    streetAddress: projectInfo.streetAddress || undefined,
                    city: projectInfo.city || undefined,
                    state: projectInfo.state || undefined,
                    zip: projectInfo.zip || undefined,
                    country: projectInfo.country || undefined,
                    sameAsMailingAddress: projectInfo.sameAsMailingAddress,
                    serviceType: projectInfo.serviceType || undefined,
                    projectType: projectInfo.projectType || undefined,
                    squareFootage: projectInfo.squareFootage 
                        ? `${projectInfo.squareFootage} ${projectInfo.projectSizeUnit === "sqm" ? "sq m" : "sq ft"}`
                        : undefined,
                    budgetRange: projectInfo.budgetRange || undefined,
                    timeline: projectInfo.timeline || undefined,
                },
                password: passwordToSend,
            }).unwrap();

            toast.success(
                response?.message ||
                (passwordToSend
                    ? "New inquiry created successfully! Client account has been set up."
                    : "New inquiry created successfully and linked to the client's existing account.")
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
                    <Link to="/dashboard" className="mr-4">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-xs font-semibold">New Inquiry</h1>
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
                                Inquiry Details
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
                            className={`flex flex-col items-center ${activeStep === "client" ? "text-gray-800 font-semibold" : ""
                                }`}
                        >
                            <div
                                className={`w-4 h-4 rounded-full ${activeStep === "client" ? "bg-gray-800" : "bg-gray-300"
                                    }`}
                            ></div>
                            <span className="text-xs mt-1">Client</span>
                        </div>
                        <div
                            className={`flex flex-col items-center ${activeStep === "project" ? "text-gray-800 font-semibold" : ""
                                }`}
                        >
                            <div
                                className={`w-4 h-4 rounded-full ${activeStep === "project"
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
                        handleNext={handleNext}
                        handleBack={handleBack}
                        isSubmitting={isCheckingEmail || isSubmitting}
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
                                    <h3 className="text-lg font-semibold text-white">Set Client Password</h3>
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
                                    The client can log in using this email and the password you set below.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
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
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
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
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
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
                                disabled={isSubmitting || !password || password.length < 6 || password !== confirmPassword}
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
    handleNext,
    handleBack,
    isSubmitting,
}: {
    projectInfo: any;
    handleProjectInfoChange: (field: string, value: string | boolean) => void;
    handleNext: () => void;
    handleBack: () => void;
    isSubmitting?: boolean;
}) {
    // Components are now imported at the top of the file

    return (
        <div className="bg-white">
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
                    onChange={(e: any) => handleProjectInfoChange("projectName", e.target.value)}
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
                    onChange={(e: any) => handleProjectInfoChange("projectDescription", e.target.value)}
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
                    onChange={(e: any) => handleProjectInfoChange("additionalContext", e.target.value)}
                />
            </div>

            {/* Project Location */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="projectLocation">Project Location</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="sameAsMailingAddress"
                            checked={projectInfo.sameAsMailingAddress}
                            onCheckedChange={(checked: any) =>
                                handleProjectInfoChange("sameAsMailingAddress", checked === true)
                            }
                        />
                        <label htmlFor="sameAsMailingAddress" className="text-sm text-gray-700 cursor-pointer">
                            Same as mailing address
                        </label>
                    </div>
                </div>

                <div className="mt-4">
                    <Label htmlFor="streetAddress" className="mb-3">Street Address</Label>
                    <Input
                        id="streetAddress"
                        value={projectInfo.streetAddress}
                        onChange={(e: any) => handleProjectInfoChange("streetAddress", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="projectCountry">Country</Label>
                        <Input
                            id="projectCountry"
                            value={projectInfo.country}
                            onChange={(e: any) => handleProjectInfoChange("country", e.target.value)}
                            placeholder="Enter country"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="projectCity">City</Label>
                        <Input
                            id="projectCity"
                            value={projectInfo.city}
                            onChange={(e: any) => handleProjectInfoChange("city", e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="projectState">State</Label>
                        <Input
                            id="projectState"
                            value={projectInfo.state}
                            onChange={(e: any) => handleProjectInfoChange("state", e.target.value)}
                            placeholder="Enter state"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="projectZip">ZIP</Label>
                        <Input
                            id="projectZip"
                            value={projectInfo.zip}
                            onChange={(e: any) => handleProjectInfoChange("zip", e.target.value)}
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
                        onValueChange={(value: any) => handleProjectInfoChange("serviceType", value)}
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
                        onValueChange={(value: any) => handleProjectInfoChange("projectType", value)}
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
                    <Label htmlFor="squareFootage">Project Size (Estimate)</Label>
                    <div className="flex justify-center items-center w-full">
                        <Input
                            id="squareFootage"
                            type="number"
                            value={projectInfo.squareFootage}
                            onChange={(e: any) => handleProjectInfoChange("squareFootage", e.target.value)}
                            className="flex-1 border-r-0 rounded-r-none"
                        />
                        <div>
                            <Select
                                value={projectInfo.projectSizeUnit || "sqf"}
                                onValueChange={(v: any) => handleProjectInfoChange("projectSizeUnit", v)}
                            >
                                <SelectTrigger className="w-full border-l-0 border-gray-300 rounded-l-none bg-gray-300">
                                    <SelectValue placeholder="Sq Ft / Sq M" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-300">
                                    <SelectItem value="sqf" className="hover:bg-gray-800 hover:text-white cursor-pointer">Sq Ft</SelectItem>
                                    <SelectItem value="sqm" className="hover:bg-gray-800 hover:text-white cursor-pointer">Sq M</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="budgetRange">Budget Range</Label>
                    <Select
                        value={projectInfo.budgetRange}
                        onValueChange={(value: any) => handleProjectInfoChange("budgetRange", value)}
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
                        onValueChange={(value: any) => handleProjectInfoChange("timeline", value)}
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
                <Button variant="outline" onClick={handleBack} className="cursor-pointer hover:bg-gray-200 hover:border-gray-200">
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
