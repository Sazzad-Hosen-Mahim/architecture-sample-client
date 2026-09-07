import type React from "react";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

import ClientTabFrom from "@/components/NewProposalTabContent/ClientTabFrom";
import ProjectTabForm from "@/components/NewProposalTabContent/ProjectTabForm";
import ServicesTabForm from "@/components/NewProposalTabContent/ServicesTabForm";
import SignProposalTab from "@/components/NewProposalTabContent/SignProposalTab";
import {
  useGetProposalInfoQuery,
  useGetProposalFullQuery,
  useUpdateProjectClientDetailsMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import { isLumpSum } from "@/utils/paymentPlan";
import { toast } from "sonner";

export interface NewDynamicProposalPageProps {
  projectData?: any;
  onProposalCreated?: (proposalData: any) => void;
}

export interface Objective {
  id: string;
  label: string;
  /** Phases added via "+ Add Phase" — renamable and removable. */
  custom?: boolean;
}

const DEFAULT_OBJECTIVES: Objective[] = [
  { id: "assemble", label: "Assemble Information" },
  { id: "schematic", label: "Schematic Design" },
  { id: "development", label: "Design Development" },
  { id: "construction", label: "Construction Documents" },
  { id: "approval", label: "AHJ Approval" },
  { id: "bidding", label: "Bidding Support" },
  { id: "construction-support", label: "Construction Support" },
  { id: "record", label: "Record Drawings" },
];

export default function NewDynamicProposalPage({
  onProposalCreated,
}: NewDynamicProposalPageProps) {
  const [activeStep, setActiveStep] = useState<
    "client" | "project" | "services" | "sign"
  >("client");
  const [progress, setProgress] = useState(0);
  // Once the proposal is with the client the wizard is over, so the step tabs
  // and journey bar give way to the confirmation screen.
  const [proposalSent, setProposalSent] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const clientSignatureRef = useRef<SignatureCanvas | null>(null);
  const architectSignatureRef = useRef<SignatureCanvas | null>(null);
  const { id } = useParams();
  const [updateClientDetails, { isLoading: isSavingClient }] =
    useUpdateProjectClientDetailsMutation();
  const [searchParams] = useSearchParams();
  const draftProposalId = searchParams.get("proposalId");
  const [draftHydrated, setDraftHydrated] = useState(false);
  // Adding a service invalidates the "Project" tag, which refetches the draft
  // query below. Without this latch the hydration effect would re-run on that
  // refetch and yank the PM back to the Services step mid-navigation.
  const hydratedFor = useRef<string | null>(null);

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
    aptSuiteUnit: "",
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

  const [objectives, setObjectives] = useState<Objective[]>(DEFAULT_OBJECTIVES);

  // Display position per service. The PM edits these in the Scope of Services
  // step and every downstream view renders in this order.
  const [objectiveOrders, setObjectiveOrders] = useState<
    Record<string, number>
  >(() =>
    Object.fromEntries(DEFAULT_OBJECTIVES.map((o, idx) => [o.id, idx + 1])),
  );

  const sortByOrder = (ids: string[]) =>
    [...ids].sort(
      (a, b) =>
        (objectiveOrders[a] ?? Number.MAX_SAFE_INTEGER) -
        (objectiveOrders[b] ?? Number.MAX_SAFE_INTEGER),
    );

  const handleOrderChange = (id: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    setObjectiveOrders((prev) => ({
      ...prev,
      [id]: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
    }));
  };

  const addCustomPhase = () => {
    const newId = `custom-${Date.now()}`;
    setObjectives((prev) => [...prev, { id: newId, label: "", custom: true }]);
    setObjectiveCosts((prev) => ({ ...prev, [newId]: 0 }));
    setObjectiveTimelines((prev) => ({ ...prev, [newId]: 0 }));
    setObjectiveOrders((prev) => ({
      ...prev,
      [newId]: Math.max(0, ...Object.values(prev)) + 1,
    }));
  };

  const updatePhaseLabel = (id: string, label: string) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, label } : o)),
    );
  };

  const removeCustomPhase = (id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
    setSelectedObjectives((prev) => prev.filter((sid) => sid !== id));
    const drop = <T,>(rec: Record<string, T>) => {
      const next = { ...rec };
      delete next[id];
      return next;
    };
    setObjectiveCosts(drop);
    setObjectiveTimelines(drop);
    setObjectiveOrders(drop);
  };

  interface Credit {
    id: string;
    type: "dollar" | "percentage";
    amount: number;
    description: string;
  }

  const [credits, setCredits] = useState<Credit[]>([]);

  // Fetch project data for auto-fill
  const { data: projectRequest } = useGetProposalInfoQuery(id || "", {
    skip: !id,
  });

  // The auto-fill below seeds the form once per project; it is not a live
  // binding to the query. `getProposalInfo` carries the "Project" tag, and
  // this wizard's own mutations — saving the project step, adding a service,
  // saving client details — all invalidate it. Re-running the seed on those
  // refetches overwrote `clientInfo` and `projectInfo` with the server copy,
  // which is why edits made after resuming a draft appeared not to save.
  const autoFilledFor = useRef<string | null>(null);

  useEffect(() => {
    if (projectRequest && autoFilledFor.current !== (id ?? null)) {
      autoFilledFor.current = id ?? null;

      // Helper function to convert API enum values to display values
      const formatServiceType = (type: string) => {
        const mapping: Record<string, string> = {
          NEW_CONSTRUCTION: "New Construction",
          RENOVATION: "Renovation",
          TENANT_IMPROVEMENT: "Tenant Improvement",
          ADDITION: "Addition",
          INTERIOR_DESIGN: "Interior Design",
          LANDSCAPE_DESIGN: "Landscape Design",
          OTHER: "Other",
        };
        return mapping[type] || type;
      };

      const formatProjectCategory = (category: string) => {
        const mapping: Record<string, string> = {
          RESIDENTIAL: "Residential",
          COMMERCIAL: "Commercial",
          INTERIOR: "Interior",
          MIXED_USE: "Mixed-Use",
          TENANT_IMPROVEMENT: "Tenant Improvement",
          REMODEL: "Remodel",
          ADDITION: "Addition",
          OTHER: "Other",
        };
        return mapping[category] || category;
      };

      // projectSize is stored as one string ("7520 sq ft"), but the form needs a
      // bare number for the <Input type="number"> plus a separate unit.
      const parseProjectSize = (size: string) => {
        const raw = String(size || "").trim();
        const amount = raw.match(/[\d.]+/)?.[0] || "";
        const isMetric = /sq\.?\s*m|sqm|m²/i.test(raw);
        return {
          squareFootage: amount,
          projectSizeUnit: isMetric ? "sqm" : "sqf",
        };
      };

      // The intake form stores slugs ("100k-250k"); this form's Select uses
      // display labels ("$100k-$250k"). Older records already hold the label.
      // Budget is now free text. Legacy rows still hold the old slug
      // values, so translate those; anything else passes through as typed.
      const formatBudgetRange = (budget: string) => {
        const mapping: Record<string, string> = {
          "under-100k": "Under $100k",
          "100k-250k": "$100k-$250k",
          "250k-500k": "$250k-$500k",
          "500k-1m": "$500k-$1M",
          "over-1m": "Over $1M",
        };
        const raw = String(budget || "").trim();
        return mapping[raw.toLowerCase()] ?? raw;
      };

      const { squareFootage, projectSizeUnit } = parseProjectSize(
        projectRequest.projectSize || "",
      );

      setClientInfo({
        firstName: projectRequest.clientFirstName || "",
        lastName: projectRequest.clientLastName || "",
        companyName: projectRequest.companyName || "",
        email: projectRequest.email || "",
        phone: projectRequest.phone || "",
        address: projectRequest.streetAddress || "",
        city: projectRequest.city || "",
        state: projectRequest.state || "",
        zip: projectRequest.zipCode || "",
        aptSuiteUnit: projectRequest.aptSuiteUnit || "",
        country: projectRequest.country || "United States",
        additionalNotes: projectRequest.additionalComments || "",
      });

      setProjectInfo({
        projectName: projectRequest.projectName || "",
        projectDescription: "",
        additionalContext: projectRequest.additionalNotes || "",
        streetAddress: projectRequest.projectStreetAddress || "",
        city: projectRequest.projectCity || "",
        state: projectRequest.projectState || "",
        zip: projectRequest.projectZipCode || "",
        country: projectRequest.projectCountry || "United States",
        sameAsMailingAddress:
          projectRequest.projectLocationSameAsClient || false,
        serviceType: formatServiceType(
          projectRequest.serviceType || "New Construction",
        ),
        projectType: formatProjectCategory(
          projectRequest.projectCategory || "",
        ),
        squareFootage,
        projectSizeUnit,
        budgetRange: formatBudgetRange(projectRequest.budgetRange || ""),
        timeline: "",
        googleDriveLink: projectRequest.driveLink || "",
      });
    }
  }, [projectRequest, id]);

  // Resume an in-progress DRAFT proposal: reload its previously-added
  // services/credits/payment method into this wizard's local state.
  const { data: draftProposalData, isError: isDraftError } =
    useGetProposalFullQuery(draftProposalId || "", { skip: !draftProposalId });

  useEffect(() => {
    // Starting a brand-new proposal: drop any draft the previous wizard run
    // left behind so the Project step creates a fresh row instead of
    // silently editing an unrelated proposal.
    if (!draftProposalId) {
      Cookies.remove("proposal_data");
      hydratedFor.current = null;
    }
  }, [draftProposalId]);

  useEffect(() => {
    if (!draftProposalId) return;
    if (hydratedFor.current === draftProposalId) return;
    const proposal = draftProposalData?.data;
    if (!proposal) {
      if (isDraftError) {
        toast.error(
          "Could not load the draft proposal. Starting a new one instead.",
        );
        hydratedFor.current = draftProposalId;
        setDraftHydrated(true);
      }
      return;
    }
    hydratedFor.current = draftProposalId;

    const services = proposal.services || [];

    // Any saved service whose name doesn't match a built-in phase was added
    // via "+ Add Phase" — recreate it so it survives resuming the draft.
    const customPhases: Objective[] = services
      .filter((s: any) => !DEFAULT_OBJECTIVES.some((o) => o.label === s.name))
      .map((s: any) => ({
        id: `custom-${s.id}`,
        label: s.name,
        custom: true,
      }));

    const allObjectives = [...DEFAULT_OBJECTIVES, ...customPhases];
    setObjectives(allObjectives);

    const idForService = (s: any) =>
      allObjectives.find((o) => o.label === s.name)?.id;

    const matchedObjectiveIds = services
      .map(idForService)
      .filter((v): v is string => Boolean(v));

    const newCosts = { ...objectiveCosts };
    const newTimelines = { ...objectiveTimelines };
    const newOrders = Object.fromEntries(
      DEFAULT_OBJECTIVES.map((o, idx) => [o.id, idx + 1]),
    ) as Record<string, number>;

    services.forEach((s: any, idx: number) => {
      const oid = idForService(s);
      if (!oid) return;
      newCosts[oid] = Number(s.amount) || 0;
      newTimelines[oid] = Number(s.timelineWeeks) || 0;
      newOrders[oid] = Number(s.order) || idx + 1;
    });

    setSelectedObjectives(matchedObjectiveIds);
    setObjectiveCosts(newCosts);
    setObjectiveTimelines(newTimelines);
    setObjectiveOrders(newOrders);
    const newTotalCost = matchedObjectiveIds.reduce(
      (sum, oid) => sum + (newCosts[oid] || 0),
      0,
    );
    setTotalCost(newTotalCost);
    setTotalWeeks(
      matchedObjectiveIds.reduce(
        (sum, oid) => sum + (newTimelines[oid] || 0),
        0,
      ),
    );

    const mappedCredits: Credit[] = (proposal.credits || []).map((c: any) => ({
      id: c.id,
      type: c.type === "DOLLAR_AMOUNT" ? "dollar" : "percentage",
      amount: Number(c.amount) || 0,
      description: c.description || "",
    }));
    setCredits(mappedCredits);

    // Read both shapes — older rows only ever got `paymentType` written.
    setPaymentMethod(isLumpSum(proposal) ? "lumpSum" : "installments");

    // Seed the cookie downstream steps (Services/Sign) expect, so they
    // keep writing to this same proposal instead of creating a new one.
    // projectRequestId lets the Project step tell "my draft" apart from a
    // leftover draft belonging to some other project.
    Cookies.set(
      "proposal_data",
      JSON.stringify({
        data: {
          id: draftProposalId,
          proposalNumber: proposal.proposalNumber,
          createdAt: proposal.createdAt,
          projectRequestId: proposal.projectRequestId || id,
        },
      }),
      { expires: 7 },
    );

    setActiveStep("services");
    setProgress(66);
    setDraftHydrated(true);
  }, [draftProposalId, draftProposalData, isDraftError, id]);

  const handleClientInfoChange = (field: string, value: string) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleProjectInfoChange = (field: string, value: string | boolean) => {
    setProjectInfo((prev) => ({ ...prev, [field]: value }));
  };

  // "Same as mailing address" only flipped a flag before — nothing copied the
  // client's address across, so ticking it did nothing visible. Mirror it
  // here, and keep mirroring while it stays ticked so editing the client
  // address on the previous step carries through.
  useEffect(() => {
    if (!projectInfo.sameAsMailingAddress) return;
    setProjectInfo((prev) => ({
      ...prev,
      streetAddress: clientInfo.address,
      city: clientInfo.city,
      state: clientInfo.state,
      zip: clientInfo.zip,
      country: clientInfo.country,
    }));
  }, [
    projectInfo.sameAsMailingAddress,
    clientInfo.address,
    clientInfo.city,
    clientInfo.state,
    clientInfo.zip,
    clientInfo.country,
  ]);

  const toggleObjective = (objectiveId: string) => {
    setSelectedObjectives((prev) => {
      const isSelected = prev.includes(objectiveId);
      const newSelected = isSelected
        ? prev.filter((id) => id !== objectiveId)
        : [...prev, objectiveId];

      // Calculate new totals
      const newTotalCost = newSelected.reduce(
        (sum, id) => sum + (objectiveCosts[id] || 0),
        0,
      );
      const newTotalWeeks = newSelected.reduce(
        (sum, id) => sum + (objectiveTimelines[id] || 0),
        0,
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
        (sum, objId) => sum + (newCosts[objId] || 0),
        0,
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
        (sum, objId) => sum + (newTimelines[objId] || 0),
        0,
      );
      setTotalWeeks(newTotalWeeks);

      return newTimelines;
    });
  };

  const handleNext = async () => {
    if (activeStep === "client") {
      // Client edits made here belong to the project request, not the
      // proposal, so persist them before moving on. Without this the
      // address is only ever printed on the PDF and then lost.
      if (id) {
        try {
          await updateClientDetails({
            id,
            clientFirstName: clientInfo.firstName,
            clientLastName: clientInfo.lastName,
            companyName: clientInfo.companyName,
            phone: clientInfo.phone,
            streetAddress: clientInfo.address,
            aptSuiteUnit: clientInfo.aptSuiteUnit,
            city: clientInfo.city,
            state: clientInfo.state,
            zipCode: clientInfo.zip,
            country: clientInfo.country,
            additionalComments: clientInfo.additionalNotes,
          }).unwrap();
        } catch (error: any) {
          console.error("Failed to save client details:", error);
          toast.error(
            error?.data?.message ||
              "Could not save the client details. Please try again.",
          );
          return;
        }
      }
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

  // The "Proposal Details" tab covers two wizard steps — Client and Project —
  // so it stays highlighted across both rather than dropping out on Project.
  const isProposalDetailsStep =
    activeStep === "client" || activeStep === "project";

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
    ref: React.MutableRefObject<SignatureCanvas | null>,
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
        projectInfo: {
          ...projectInfo,
          squareFootage: projectInfo.squareFootage
            ? `${projectInfo.squareFootage} ${projectInfo.projectSizeUnit === "sqm" ? "sq m" : "sq ft"}`
            : "",
        },
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
        JSON.stringify(proposalData.selectedObjectives, null, 2),
      );
      console.log("4. PAYMENT METHOD:", paymentMethod);
      console.log(
        "5. FINANCIAL SUMMARY:",
        JSON.stringify(proposalData.financialSummary, null, 2),
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
        JSON.stringify(proposalData, null, 2),
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
          "At least one service objective must be selected",
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
          `Please fix the following errors:\n${validationErrors.join("\n")}`,
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
          `Failed to submit proposal: ${response.status} ${errorText}`,
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

      // Cleanup the cloned node
      document.body.removeChild(clone);

      // Reset button
      if (downloadBtn) {
        downloadBtn.textContent = originalText;
        (downloadBtn as HTMLButtonElement).disabled = false;
      }

      console.log("PDF generated successfully!");
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

  if (draftProposalId && !draftHydrated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        <p className="text-sm text-gray-500">Loading your draft proposal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white ">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 ">
        <div className="  py-4 px-20 flex items-center border-b border-gray-300">
          <Link
            to="/dashboard"
            className="mr-4 flex justify-center items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <h1 className="text-xs font-semibold">Back To Dashboard</h1>
          </Link>
        </div>
      </header>

      {/* Progress Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!proposalSent && (
          <div className="bg-white rounded-lg shadow-sm p-2 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4 overflow-x-auto md:overflow-x-visible">
                <Button
                  variant={isProposalDetailsStep ? "default" : "outline"}
                  className={`${isProposalDetailsStep ? "rounded-full bg-black text-white" : "rounded-full text-black"}`}
                  onClick={() => setActiveStep("client")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Proposal Details
                </Button>
                <Button
                  variant={activeStep === "services" ? "default" : "outline"}
                  className={`${activeStep === "services" ? "rounded-full bg-black text-white" : "rounded-full text-black"}`}
                  onClick={() => setActiveStep("services")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Scope of Services
                </Button>
                <Button
                  variant={activeStep === "sign" ? "default" : "outline"}
                  className={`${activeStep === "sign" ? "rounded-full bg-black text-white" : "rounded-full text-black"}`}
                  onClick={() => setActiveStep("sign")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {!proposalSent && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Proposal Journey</span>
              <span className="text-sm text-gray-500">
                {progress}% Complete
              </span>
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
        )}

        {/* Client Information Step */}
        {activeStep === "client" && (
          <ClientTabFrom
            clientInfo={clientInfo}
            handleClientInfoChange={handleClientInfoChange}
            handleNext={handleNext}
            isSaving={isSavingClient}
          />
        )}

        {/* Project Information Step */}
        {activeStep === "project" && (
          <ProjectTabForm
            id={id}
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
            objectiveOrders={objectiveOrders}
            handleOrderChange={handleOrderChange}
            addCustomPhase={addCustomPhase}
            updatePhaseLabel={updatePhaseLabel}
            removeCustomPhase={removeCustomPhase}
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
            selectedObjectives={sortByOrder(selectedObjectives)}
            objectives={objectives}
            objectiveCosts={objectiveCosts}
            objectiveOrders={objectiveOrders}
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
            projectRequestId={id}
            onSent={() => setProposalSent(true)}
          />
        )}
      </div>
    </div>
  );
}
