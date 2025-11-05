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

import { Link } from "react-router-dom";

import ClientTabFrom from "@/components/NewProposalTabContent/ClientTabFrom";
import ProjectTabForm from "@/components/NewProposalTabContent/ProjectTabForm";
import ServicesTabForm from "@/components/NewProposalTabContent/ServicesTabForm";
import SignProposalTab from "@/components/NewProposalTabContent/SignProposalTab";

// Add this function to check for holidays (you can expand this list as needed)

// Modify the getWorkingDays function

export interface NewProposalPageProps {
  projectData?: any;
  onProposalCreated?: (proposalData: any) => void;
}

export default function NewProposalPage({
  onProposalCreated,
}: NewProposalPageProps) {
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
      const fileName = `Proposal_${clientInfo.firstName}_${
        clientInfo.lastName
      }_${projectInfo.projectName || "Project"}_${
        new Date().toISOString().split("T")[0]
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

      // ✅ html2pdf configuration
      // const opt = {
      //   margin: [0.5, 0.5, 0.5, 0.5], // inch margins
      //   filename: fileName,
      //   image: { type: "jpeg", quality: 0.98 },
      //   html2canvas: {
      //     scale: 2,
      //     useCORS: true,
      //     scrollX: 0,
      //     scrollY: 0,
      //     // Capture full height
      //     windowWidth: clone.scrollWidth,
      //     windowHeight: clone.scrollHeight + 500, // buffer to avoid cropping bottom
      //   },
      //   jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      //   pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      // };

      // // ✅ Generate and save PDF
      // await html2pdf().set(opt).from(clone).save();

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
      alert("Error generating PDF. Please try again.");

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
                    : progress >= 33
                    ? "bg-gray-800"
                    : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs mt-1">Project</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                activeStep === "services" ? "text-gray-800 font-semibold" : ""
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  activeStep === "services"
                    ? "bg-gray-800"
                    : progress >= 66
                    ? "bg-gray-800"
                    : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs mt-1">Services</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                activeStep === "sign" ? "text-gray-800 font-semibold" : ""
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  activeStep === "sign"
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

// main sign  component

//  {activeStep === "sign" && (
//           <div className="bg-white rounded-lg shadow-sm p-6">
//             <div className="max-w-4xl mx-auto">
//               <div className="mb-8">
//                 <h2 className="text-xl font-semibold mb-2">
//                   Architecture Simple
//                 </h2>
//                 {/* <p className="text-gray-600">Professional Services Proposal</p> */}
//                 <div className="flex justify-between mt-4">
//                   <div>
//                     <p className="font-medium">Client Name</p>
//                     <p>
//                       {clientInfo.firstName} {clientInfo.lastName}
//                     </p>
//                     <p>{projectInfo.streetAddress}</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="font-medium">Date:</p>
//                     <p>{new Date().toLocaleDateString()}</p>
//                     <p>File No. 25-0001</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">Subject:</h3>
//                 <p>Professional Services Proposal</p>
//                 <p>
//                   {clientInfo.firstName} {clientInfo.lastName}
//                   {projectInfo.streetAddress}
//                 </p>
//               </div>

//               <div className="mb-8">
//                 <p className="mb-4">Dear Client,</p>
//                 <p className="mb-4">
//                   Architecture Simple is pleased to present this design services
//                   proposal for the proposed {projectInfo.serviceType} of a
//                   {projectInfo.projectDescription
//                     ? ` (${projectInfo.projectDescription})`
//                     : ""}{" "}
//                   at {projectInfo.streetAddress}.
//                 </p>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Project Understanding
//                 </h3>
//                 <p className="mb-4">
//                   The project is located in {projectInfo.city},{" "}
//                   {projectInfo.state}.
//                 </p>
//                 {projectInfo.projectDescription && (
//                   <p className="mb-4">{projectInfo.projectDescription}</p>
//                 )}
//                 {projectInfo.additionalContext && (
//                   <p className="mb-4">{projectInfo.additionalContext}</p>
//                 )}
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Article 1 - Definitions
//                 </h3>
//                 <p className="mb-4">
//                   To establish a clear understanding, the following terms are
//                   defined for use throughout this Agreement:
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Architect"</strong> refers to Architecture Simple,
//                   represented by Eric Rivera, AIA, who will provide professional
//                   architectural services as detailed in this Agreement.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Owner"</strong> refers to {clientInfo.firstName}{" "}
//                   {clientInfo.lastName}, the individual or entity who is
//                   entering into this Agreement with the Architect to develop the
//                   Project.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Project"</strong> refers to the construction of a
//                   residential building at {projectInfo.streetAddress},{" "}
//                   {projectInfo.city}, {projectInfo.state} {projectInfo.zip}, as
//                   more specifically described in the Proposal attached hereto.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Work"</strong> refers to all architectural,
//                   engineering, and related professional services required for
//                   the design, development, and documentation of the Project, as
//                   set forth in the Scope of Services.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Design Documents" (DDs)</strong> refers to the
//                   completed Schematic Design and Design Development documents,
//                   including all drawings, specifications, and other materials
//                   prepared by the Architect as part of the development of the
//                   Project.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Construction Documents" (CDs)</strong> refers to the
//                   completed set of final documents that provide the necessary
//                   details for construction and permitting, including plans,
//                   specifications, and other materials, prepared by the
//                   Architect.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Bidding Documents"</strong> refers to the final,
//                   completed Construction Documents and any related documents
//                   issued to contractors or bidders.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Substantial Completion"</strong> means the point in
//                   time when the Project is sufficiently complete in accordance
//                   with the Contract Documents, allowing the Owner to occupy or
//                   utilize the building for its intended use.
//                 </p>
//                 <p className="mb-2">
//                   <strong>"Completion"</strong> refers to the final completion
//                   of all construction work, including punch list items and final
//                   inspections, after which the Project is fully delivered to the
//                   Owner.
//                 </p>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Article 2 - Scope of Services
//                 </h3>
//                 <p className="mb-4">
//                   The Architect agrees to provide the following services for the
//                   Project as outlined in the Proposal, which is incorporated
//                   herein by reference.
//                 </p>
//                 {selectedObjectives.length > 0 ? (
//                   <ul className="list-disc pl-6 mb-4">
//                     {selectedObjectives.map((id) => {
//                       const objective = objectives.find((o) => o.id === id);
//                       return objective ? (
//                         <li key={id} className="mb-2">
//                           {objective.label}
//                         </li>
//                       ) : null;
//                     })}
//                   </ul>
//                 ) : (
//                   <p className="italic text-gray-500">
//                     No services have been selected.
//                   </p>
//                 )}
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Article 3 - Payment Terms
//                 </h3>
//                 <h4 className="font-medium mb-2">3.1 Payment Structure</h4>
//                 <p className="mb-4">
//                   The total fee for the services provided under this Agreement
//                   shall be (
//                   {paymentMethod === "lumpSum"
//                     ? "lump sum"
//                     : "installments upon task completion"}
//                   ) for the amount of ${totalCost.toLocaleString()}, as follows:
//                 </p>

//                 <table className="w-full mb-4 border-collapse">
//                   <thead>
//                     <tr className="bg-gray-100">
//                       <th className="border p-2 text-sm text-left">
//                         PROFESSIONAL SERVICES FEE
//                       </th>
//                       <th className="border p-2 text-sm text-right">AMOUNT</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {selectedObjectives.map((id) => {
//                       const objective = objectives.find((o) => o.id === id);
//                       return objective ? (
//                         <tr key={id}>
//                           <td className="border p-2">{objective.label}</td>
//                           <td className="border p-2 text-right">
//                             ${objectiveCosts[id]?.toLocaleString() || "0"}
//                           </td>
//                         </tr>
//                       ) : null;
//                     })}
//                     {selectedObjectives.length === 0 && (
//                       <tr>
//                         <td className="border p-2">No services selected</td>
//                         <td className="border p-2 text-right">$0</td>
//                       </tr>
//                     )}
//                     {credits.length > 0 && (
//                       <>
//                         <tr className="bg-gray-50">
//                           <td colSpan={2} className="border p-2 font-medium">
//                             Credits Applied
//                           </td>
//                         </tr>
//                         {credits.map((credit) => (
//                           <tr key={credit.id}>
//                             <td className="border p-2 pl-4 text-sm">
//                               {credit.description ||
//                                 (credit.type === "dollar"
//                                   ? "Dollar Credit"
//                                   : "Percentage Credit")}
//                             </td>
//                             <td className="border p-2 text-right text-green-600">
//                               -
//                               {credit.type === "dollar"
//                                 ? `$${credit.amount.toLocaleString()}`
//                                 : `$${(
//                                     (totalCost * credit.amount) /
//                                     100
//                                   ).toLocaleString()} (${credit.amount}%)`}
//                             </td>
//                           </tr>
//                         ))}
//                       </>
//                     )}
//                   </tbody>
//                   <tfoot>
//                     <tr className="bg-gray-100">
//                       <td className="border p-2 text-sm font-bold">
//                         GRAND TOTAL
//                       </td>
//                       <td className="border p-2 text-right font-bold text-lg">
//                         ${finalCost.toLocaleString()}
//                       </td>
//                     </tr>
//                   </tfoot>
//                 </table>

//                 <h4 className="font-medium mb-2">3.2 Payment Schedule</h4>

//                 {paymentMethod === "lumpSum" ? (
//                   <>
//                     <p className="mb-4">
//                       The Owner will pay the full amount upon execution of this
//                       Agreement.
//                     </p>
//                     <ul className="list-disc pl-6 mb-4">
//                       <li>
//                         <strong>Lump Sum Payment:</strong> The Owner will pay
//                         the full lump sum of ${finalCost.toLocaleString()} at
//                         the beginning of the Project, upon execution of this
//                         Agreement.
//                       </li>
//                     </ul>
//                   </>
//                 ) : (
//                   <>
//                     <p className="mb-4">
//                       The Owner will pay in installments based on the completion
//                       of each objective.
//                     </p>
//                     <table className="w-full mb-4 border-collapse">
//                       <thead>
//                         <tr className="bg-gray-100">
//                           <th className="border p-2 text-left">Objective</th>
//                           <th className="border p-2 text-right">
//                             Payment Amount
//                           </th>
//                           <th className="border p-2 text-right">Timeline</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {selectedObjectives.map((id) => {
//                           const objective = objectives.find((o) => o.id === id);
//                           return objective ? (
//                             <tr key={id}>
//                               <td className="border p-2">{objective.label}</td>
//                               <td className="border p-2 text-right">
//                                 ${objectiveCosts[id]?.toLocaleString() || "0"}
//                               </td>
//                               <td className="border p-2 text-right">
//                                 {objectiveTimelines[id] || "0"} weeks
//                               </td>
//                             </tr>
//                           ) : null;
//                         })}
//                       </tbody>
//                     </table>

//                     <p className="mb-4">
//                       <strong>Initial Payment:</strong> 25% of the total fee ($
//                       {Math.round(finalCost * 0.25).toLocaleString()}) is due
//                       upon execution of this Agreement.
//                     </p>
//                     <p className="mb-4">
//                       <strong>Remaining Payments:</strong> The remaining balance
//                       will be invoiced upon completion of each objective as
//                       outlined above.
//                     </p>
//                   </>
//                 )}

//                 <h4 className="font-medium mb-2">3.3 Payment Terms</h4>
//                 <p className="mb-4">
//                   All invoices are due within 30 days of receipt. Late payments
//                   are subject to a 1.5% monthly interest charge.
//                 </p>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Article 4 - Additional Services
//                 </h3>
//                 <p className="mb-4">
//                   Additional services not specified in the Scope of Services are
//                   available upon request and can be provided on a time and
//                   materials basis, according to the Fee Schedule shown in
//                   Exhibit A.
//                 </p>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg  font-semibold mb-4">
//                   Article 5 - Owner's Responsibilities
//                 </h3>
//                 <p className="mb-4">The Owner agrees to:</p>
//                 <ul className="list-disc pl-6 mb-4">
//                   <li className="mb-2">
//                     Provide all necessary documents, approvals, and access to
//                     the site as required for the Architect to perform the Work.
//                   </li>
//                   <li className="mb-2">
//                     Secure all necessary approvals and permits from the local
//                     AHJ.
//                   </li>
//                   <li className="mb-2">
//                     Notify the Architect of any changes in the scope of services
//                     or design and provide prompt written authorization for any
//                     additional services.
//                   </li>
//                 </ul>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Project Information
//                 </h3>
//                 <p className="mb-2">
//                   Project Name: {projectInfo.projectName || "[Project Name]"}
//                 </p>
//                 <p className="mb-2">Project Number: 25-0001</p>
//               </div>

//               <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                   <h4 className="font-semibold text-sm mb-4">OWNER</h4>
//                   <div className="border border-dashed p-4 mb-4 h-32 flex items-center justify-center">
//                     <div className="flex flex-col gap-2">
//                       <label className="text-sm text-gray-700">
//                         Owner Signature
//                       </label>

//                       <input
//                         type="text"
//                         placeholder="Type your name"
//                         value={signature}
//                         onChange={(e) => setSignature(e.target.value)}
//                         className="border border-gray-300 rounded px-3 py-2 font-cursive text-lg"
//                       />

//                       {/* Show warning if empty */}
//                       {signature.trim() === "" && (
//                         <p className="text-gray-400">
//                           Owner signature required
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div>
//                     <SignatureCanvas
//                       ref={clientSignatureRef}
//                       canvasProps={{
//                         width: 300,
//                         height: 150,
//                         className: "border rounded-md",
//                       }}
//                     />
//                     <div className="flex justify-between mr-7">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="mt-2"
//                         onClick={() => clearSignature(clientSignatureRef)}
//                       >
//                         Clear
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="mt-2"
//                         onClick={() => clearSignature(clientSignatureRef)}
//                       >
//                         Sign
//                       </Button>
//                     </div>
//                   </div>
//                   <p className="mt-4">
//                     Name: {clientInfo.firstName} {clientInfo.lastName}
//                   </p>
//                   {/* <p>Date: ___________________</p> */}
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-4 text-sm">ARCHITECT</h4>
//                   <div className="border border-dashed p-4 mb-4 h-32 flex items-center justify-center">
//                     <div className="flex flex-col gap-2">
//                       <label className="text-sm text-gray-700">
//                         Architect Signature
//                       </label>

//                       <input
//                         type="text"
//                         placeholder="Type your name"
//                         value={signatureAr}
//                         onChange={(e) => setSignatureAr(e.target.value)}
//                         className="border border-gray-300 rounded px-3 py-2 font-cursive text-lg"
//                       />

//                       {/* Show warning if empty */}
//                       {signatureAr.trim() === "" && (
//                         <p className="text-gray-400">
//                           Architect signature required
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div>
//                     <SignatureCanvas
//                       ref={architectSignatureRef}
//                       canvasProps={{
//                         width: 300,
//                         height: 150,
//                         className: "border rounded-md",
//                       }}
//                     />
//                     <div className="flex justify-between mr-7">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="mt-2"
//                         onClick={() => clearSignature(architectSignatureRef)}
//                       >
//                         Clear
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="mt-2"
//                         onClick={() => clearSignature(architectSignatureRef)}
//                       >
//                         Sign
//                       </Button>
//                     </div>
//                   </div>
//                   <p className="mt-4">Name: Eric Rivera, AIA</p>
//                   {/* <p>Date: ___________________</p> */}
//                 </div>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Article 6 - Schedule + Contact Information
//                 </h3>
//                 <p className="mb-4">
//                   Architecture Simple will provide architectural services as
//                   outlined in this proposal. The estimated timeline for
//                   completion of all active objectives is {totalWeeks} weeks.
//                   Upon client signature, the official contract start date will
//                   be set to the following Monday, and the project timeline will
//                   commence from that date. This approach ensures clear milestone
//                   tracking and efficient project scheduling from the beginning
//                   of the work week.
//                 </p>

//                 <h4 className="font-medium mb-2">Schedule</h4>
//                 <p className="mb-4">
//                   Architecture Simple is prepared to commence design efforts
//                   immediately upon acceptance of this proposal and the issuance
//                   of a written notice to proceed.
//                 </p>

//                 <h4 className="font-medium mb-2">Contact Information</h4>
//                 <p className="mb-1">Eric Rivera, AIA, LEED</p>
//                 <p className="mb-1">Principal, Architecture Simple</p>
//                 <p className="mb-1">Email: eric@architecturesimple.com</p>
//                 <p className="mb-4">Phone: +1 (925) 822-4374</p>
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-xl font-semibold mb-4">
//                   Exhibit A: Professional Services Fee Schedule
//                 </h3>
//                 <table className="w-full border-collapse">
//                   <thead>
//                     <tr className="bg-gray-100">
//                       <th className="border p-2 text-left">CLASSIFICATION</th>
//                       <th className="border p-2 text-right">RATE</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       <td className="border p-2">Principal</td>
//                       <td className="border p-2 text-right">$200.00/Hour</td>
//                     </tr>
//                     <tr>
//                       <td className="border p-2">Project Architect</td>
//                       <td className="border p-2 text-right">$150.00/Hour</td>
//                     </tr>
//                     <tr>
//                       <td className="border p-2">Project Manager</td>
//                       <td className="border p-2 text-right">$130.00/Hour</td>
//                     </tr>
//                     <tr>
//                       <td className="border p-2">Designer</td>
//                       <td className="border p-2 text-right">$110.00/Hour</td>
//                     </tr>
//                     <tr>
//                       <td className="border p-2">Job Captain</td>
//                       <td className="border p-2 text-right">$90.00/Hour</td>
//                     </tr>
//                     <tr>
//                       <td className="border p-2">CAD Technician</td>
//                       <td className="border p-2 text-right">$80.00/Hour</td>
//                     </tr>
//                     <tr>
//                       <td className="border p-2">Interior Design & Planning</td>
//                       <td className="border p-2 text-right">$75.00/Hour</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>

//               <div className="flex justify-end space-x-4 mt-8">
//                 <Button variant="outline">Download PDF</Button>
//                 <Button variant="outline">Print</Button>
//                 <Button onClick={handleSubmit}>Send Proposal</Button>
//               </div>
//             </div>

//             <div className="flex justify-between mt-6">
//               <Button variant="outline" onClick={handleBack}>
//                 Back
//               </Button>
//             </div>
//           </div>
//         )}
