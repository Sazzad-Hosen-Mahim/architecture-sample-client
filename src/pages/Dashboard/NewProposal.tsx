// export default function NewProposal() {
//   return <div> iam the NewProposal pages </div>;
// }

import type React from "react";

import { useState } from "react";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// import { Checkbox } from "@/components/ui/checkbox";
// import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";

import { Link, useSearchParams } from "react-router-dom";

import ClientTabFrom from "@/components/NewProposalTabContent/ClientTabFrom";
import ProjectTabForm from "@/components/NewProposalTabContent/ProjectTabForm";
import ServicesTabForm from "@/components/NewProposalTabContent/ServicesTabForm";
import SignProposalTab from "@/components/NewProposalTabContent/SignProposalTab";
import { toast } from "sonner";

// Add this function to check for holidays (you can expand this list as needed)

// Modify the getWorkingDays function

export interface NewProposalPageProps {
  projectData?: any;
  onProposalCreated?: (proposalData: any) => void;
}

export default function NewProposalPage({
  onProposalCreated,
}: NewProposalPageProps) {
  const [searchParams] = useSearchParams();
  const projectRequestId = searchParams.get("projectRequestId") || undefined;
  // const router = useRouter();
  const [activeStep, setActiveStep] = useState<
    "client" | "project" | "services" | "sign"
  >("client");
  const [progress, setProgress] = useState(0);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const clientSignatureRef = useRef<SignatureCanvas | null>(null);
  const architectSignatureRef = useRef<SignatureCanvas | null>(null);

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
    budgetRange: "",
    timeline: "",
    googleDriveLink: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("lumpSum");
  const [totalCost, setTotalCost] = useState(0);
  const [totalWeeks, setTotalWeeks] = useState(0);

  const [objectiveCosts, setObjectiveCosts] = useState<Record<string, number>>({
    assemble: 0,
    schematic: 0,
    development: 0,
    construction: 0,
    approval: 0,
    bidding: 0,
    "construction-support": 0,
    record: 0,
  });

  const [objectiveTimelines, setObjectiveTimelines] = useState<
    Record<string, number>
  >({
    assemble: 0,
    schematic: 0,
    development: 0,
    construction: 0,
    approval: 0,
    bidding: 0,
    "construction-support": 0,
    record: 0,
  });

  const objectives = [
    { id: "assemble", label: "Assemble Information" },
    { id: "schematic", label: "Schematic Design" },
    { id: "development", label: "Design Development" },
    { id: "construction", label: "Construction Documents" },
    { id: "approval", label: "AHJ Approval" },
    { id: "bidding", label: "Bidding Support" },
    { id: "construction-support", label: "Construction Support" },
    { id: "record", label: "Record Drawings" },
  ];

  interface Credit {
    id: string;
    type: "dollar" | "percentage";
    amount: number;
    description: string;
  }

  // Add this to the component state declarations
  const [credits, setCredits] = useState<Credit[]>([]);
  const handleClientInfoChange = (field: string, value: string) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleProjectInfoChange = (field: string, value: string | boolean) => {
    setProjectInfo((prev) => ({ ...prev, [field]: value }));
  };

  const toggleObjective = (objectiveId: string) => {
    setSelectedObjectives((prev) => {
      const isSelected = prev.includes(objectiveId);
      const newSelected = isSelected
        ? prev.filter((id) => id !== objectiveId)
        : [...prev, objectiveId];

      // Calculate new totals
      const newTotalCost = newSelected.reduce(
        (sum, id) => sum + objectiveCosts[id],
        0
      );
      const newTotalWeeks = newSelected.reduce(
        (sum, id) => sum + objectiveTimelines[id],
        0
      );

      setTotalCost(newTotalCost);
      setTotalWeeks(newTotalWeeks);

      return newSelected;
    });
  };

  const handleCostChange = (id: string, value: string) => {
    const numValue = value === "" ? 0 : Number.parseInt(value, 10);
    setObjectiveCosts((prev) => {
      const newCosts = { ...prev, [id]: numValue };

      // Recalculate total cost
      const newTotalCost = selectedObjectives.reduce(
        (sum, objId) => sum + newCosts[objId],
        0
      );
      setTotalCost(newTotalCost);

      return newCosts;
    });
  };

  const handleTimelineChange = (id: string, value: string) => {
    const numValue = value === "" ? 0 : Number.parseInt(value, 10);
    setObjectiveTimelines((prev) => {
      const newTimelines = { ...prev, [id]: numValue };

      // Recalculate total timeline
      const newTotalWeeks = selectedObjectives.reduce(
        (sum, objId) => sum + newTimelines[objId],
        0
      );
      setTotalWeeks(newTotalWeeks);

      return newTimelines;
    });
  };

  const handleNext = () => {
    if (activeStep === "client") {
      setActiveStep("project");
      setProgress(33);
    } else if (activeStep === "project") {
      setActiveStep("services");
      setProgress(66);
    } else if (activeStep === "services") {
      setActiveStep("sign");
      setProgress(100);
    }
  };

  const handleBack = () => {
    if (activeStep === "project") {
      setActiveStep("client");
      setProgress(0);
    } else if (activeStep === "services") {
      setActiveStep("project");
      setProgress(33);
    } else if (activeStep === "sign") {
      setActiveStep("services");
      setProgress(66);
    }
  };

  const clearSignature = (
    ref: React.MutableRefObject<SignatureCanvas | null>
  ) => {
    ref.current?.clear();
  };

  const calculateTotalCredits = () => {
    return credits.reduce((total, credit) => {
      if (credit.type === "dollar") {
        return total + credit.amount;
      } else {
        // For percentage, calculate the amount based on the total cost
        return total + (totalCost * credit.amount) / 100;
      }
    }, 0);
  };

  const finalCost = totalCost - calculateTotalCredits();
  const [signature, setSignature] = useState("");
  const [signatureAr, setSignatureAr] = useState("");

  // handel submit fun

  const handleSubmit = async () => {
    try {
      const proposalData = {
        clientInfo,
        projectInfo,
        selectedObjectives: selectedObjectives.map((id) => ({
          id,
          name: objectives.find((o) => o.id === id)?.label,
          cost: objectiveCosts[id],
          timeline: objectiveTimelines[id],
        })),
        paymentMethod,
        financialSummary: {
          totalCost,
          credits: calculateTotalCredits(),
          finalCost,
          totalWeeks,
        },
        signatures: {
          client: clientSignatureRef.current?.toDataURL(),
          architect: architectSignatureRef.current?.toDataURL(),
          clientName: signature,
          architectName: signatureAr,
        },
        createdAt: new Date().toISOString(),
      };

      // Debug: Log all data before sending
      console.log("=== PROPOSAL DATA BEING SENT TO BACKEND ===");
      console.log("1. CLIENT INFO:", JSON.stringify(clientInfo, null, 2));
      console.log("2. PROJECT INFO:", JSON.stringify(projectInfo, null, 2));
      console.log(
        "3. SELECTED OBJECTIVES:",
        JSON.stringify(proposalData.selectedObjectives, null, 2)
      );
      console.log("4. PAYMENT METHOD:", paymentMethod);
      console.log(
        "5. FINANCIAL SUMMARY:",
        JSON.stringify(proposalData.financialSummary, null, 2)
      );
      console.log("6. SIGNATURES:", {
        clientName: signature,
        architectName: signatureAr,
        clientSignatureLength: proposalData.signatures.client?.length || 0,
        architectSignatureLength:
          proposalData.signatures.architect?.length || 0,
      });
      console.log(
        "7. FULL PROPOSAL DATA:",
        JSON.stringify(proposalData, null, 2)
      );
      console.log("=== END PROPOSAL DATA ===");

      // Validate critical data
      const validationErrors = [];

      if (!clientInfo.firstName || !clientInfo.lastName) {
        validationErrors.push("Client name is required");
      }

      if (!clientInfo.email) {
        validationErrors.push("Client email is required");
      }

      if (!projectInfo.projectName) {
        validationErrors.push("Project name is required");
      }

      if (selectedObjectives.length === 0) {
        validationErrors.push(
          "At least one service objective must be selected"
        );
      }

      if (!signature.trim()) {
        validationErrors.push("Client signature is required");
      }

      if (!signatureAr.trim()) {
        validationErrors.push("Architect signature is required");
      }

      if (validationErrors.length > 0) {
        console.error("VALIDATION ERRORS:", validationErrors);
        alert(
          `Please fix the following errors:\n${validationErrors.join("\n")}`
        );
        return;
      }

      // Send to backend
      console.log("Sending data to /api/proposals...");

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proposalData),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response error:", errorText);
        throw new Error(
          `Failed to submit proposal: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Backend response:", result);

      // Call the callback if provided
      if (onProposalCreated) {
        onProposalCreated(result);
      } else {
        console.log("Proposal created successfully, redirecting...");
        // router.push("/studio");
      }
    } catch (error) {
      console.error("Error submitting proposal:", error);
      // Handle error (show toast, etc.)
    }
  };

  // handel  download pdf file  handler
  // Add this function to your parent component
  // handel download pdf file handler - FIXED VERSION
  // ALTERNATIVE APPROACH - Better for long content

  const downloadPDF = async () => {
    try {
      const proposalContent = document.getElementById("proposal-content");
      if (!proposalContent) {
        console.error("Proposal content not found");
        return;
      }

      // Show loading state
      const downloadBtn = document.querySelector("[data-download-btn]");
      const originalText = "Download PDF";
      if (downloadBtn) {
        downloadBtn.textContent = "Generating PDF...";
        (downloadBtn as HTMLButtonElement).disabled = true;
      }

      // File name
      const fileName = `Proposal_${clientInfo.firstName}_${clientInfo.lastName
        }_${projectInfo.projectName || "Project"}_${new Date().toISOString().split("T")[0]
        }.pdf`;
      console.log(fileName);
      //  Clone the element so we can expand it fully
      const clone = proposalContent.cloneNode(true) as HTMLElement;
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.display = "block";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      // Wait a short moment to ensure styles apply
      await new Promise((resolve) => setTimeout(resolve, 500));



      // Cleanup the cloned node
      document.body.removeChild(clone);

      // Reset button
      if (downloadBtn) {
        downloadBtn.textContent = originalText;
        (downloadBtn as HTMLButtonElement).disabled = false;
      }

      console.log("PDF generated successfully ✅");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error generating PDF. Please try again.");

      const downloadBtn = document.querySelector("[data-download-btn]");
      if (downloadBtn) {
        downloadBtn.textContent = "Download PDF";
        (downloadBtn as HTMLButtonElement).disabled = false;
      }
    }
  };

  return (
    <div className="min-h-screen bg-white ">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 ">
        <div className="  py-4 px-20 flex items-center border-b border-gray-300">
          <Link to="/dashboard" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xs font-semibold">New Proposal</h1>
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
                Proposal Details
              </Button>
              <Button
                variant={activeStep === "services" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveStep("services")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Scope of Services
              </Button>
              <Button
                variant={activeStep === "sign" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveStep("sign")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Proposal Journey</span>
            <span className="text-sm text-gray-500">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-800 h-2 rounded-full"
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
                  : progress >= 33
                    ? "bg-gray-800"
                    : "bg-gray-300"
                  }`}
              ></div>
              <span className="text-xs mt-1">Project</span>
            </div>
            <div
              className={`flex flex-col items-center ${activeStep === "services" ? "text-gray-800 font-semibold" : ""
                }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${activeStep === "services"
                  ? "bg-gray-800"
                  : progress >= 66
                    ? "bg-gray-800"
                    : "bg-gray-300"
                  }`}
              ></div>
              <span className="text-xs mt-1">Services</span>
            </div>
            <div
              className={`flex flex-col items-center ${activeStep === "sign" ? "text-gray-800 font-semibold" : ""
                }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${activeStep === "sign"
                  ? "bg-gray-800"
                  : progress >= 100
                    ? "bg-gray-800"
                    : "bg-gray-300"
                  }`}
              ></div>
              <span className="text-xs mt-1">Sign</span>
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

        {/* Project Information Step */}
        {activeStep === "project" && (
          <ProjectTabForm
            id={projectRequestId}
            projectInfo={projectInfo}
            handleProjectInfoChange={handleProjectInfoChange}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        )}

        {/* Services Step */}
        {activeStep === "services" && (
          <ServicesTabForm
            objectives={objectives}
            selectedObjectives={selectedObjectives}
            toggleObjective={toggleObjective}
            objectiveCosts={objectiveCosts}
            objectiveTimelines={objectiveTimelines}
            handleCostChange={handleCostChange}
            handleTimelineChange={handleTimelineChange}
            credits={credits}
            setCredits={setCredits}
            calculateTotalCredits={calculateTotalCredits}
            totalCost={totalCost}
            totalWeeks={totalWeeks}
            finalCost={finalCost}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        )}

        {/* Sign Step */}
        {activeStep === "sign" && (
          <SignProposalTab
            clientInfo={clientInfo}
            projectInfo={projectInfo}
            selectedObjectives={selectedObjectives}
            objectives={objectives}
            objectiveCosts={objectiveCosts}
            credits={credits}
            paymentMethod={paymentMethod}
            totalCost={totalCost}
            finalCost={finalCost}
            objectiveTimelines={objectiveTimelines}
            totalWeeks={totalWeeks}
            signature={signature}
            setSignature={setSignature}
            signatureAr={signatureAr}
            setSignatureAr={setSignatureAr}
            clientSignatureRef={clientSignatureRef}
            architectSignatureRef={architectSignatureRef}
            clearSignature={clearSignature}
            handleSubmit={handleSubmit}
            handleBack={handleBack}
            downloadPDF={downloadPDF}
          />
        )}
      </div>
    </div>
  );
}


