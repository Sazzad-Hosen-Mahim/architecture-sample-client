import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import React, { useState } from "react";
import Cookies from "js-cookie";
import { useSendProposalToClientMutation } from "@/redux/api/adminDashboard/proposalApi";
import { useGetMasterContractArticlesQuery } from "@/redux/api/adminDashboard/masterContractApi";
import { getServiceScopeDescription } from "@/lib/serviceDescriptions";
import { pdf } from '@react-pdf/renderer';
import { ContractPDF } from "@/components/Deshboard/ContractReviewModal";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle, LayoutDashboard, Loader2, Plus, Trash2 } from "lucide-react";
import { useResponsiveSignatureCanvas } from "@/hooks/useResponsiveSignatureCanvas";
import { useNavigate } from "react-router-dom";

interface ProposalSignProps {
  clientInfo: any;
  projectInfo: any;
  selectedObjectives: any[];
  objectives: any[];
  objectiveCosts: Record<string, number>;
  objectiveTimelines: Record<string, number>;
  objectiveOrders?: Record<string, number>;
  credits: any[];
  totalCost: number;
  finalCost: number;
  paymentMethod: string;
  totalWeeks: number;
  signature: string;
  setSignature: (value: string) => void;
  signatureAr: string;
  setSignatureAr: (value: string) => void;
  clientSignatureRef: React.RefObject<SignatureCanvas | null>;
  architectSignatureRef: React.RefObject<SignatureCanvas | null>;
  clearSignature: (ref: React.RefObject<SignatureCanvas | null>) => void;
  handleSubmit: () => void;
  handleBack: () => void;
  downloadPDF: () => void;
  /** Project request this proposal belongs to — the "Back to Project Details"
   *  button on the sent screen deep-links to its details modal. */
  projectRequestId?: string;
  /** Lets the wizard shell drop its step tabs once the proposal is on its way. */
  onSent?: () => void;
}

const SignProposalTab: React.FC<ProposalSignProps> = ({
  clientInfo,
  projectInfo,
  selectedObjectives,
  objectives,
  objectiveCosts,
  objectiveOrders,
  totalCost,
  paymentMethod,
  architectSignatureRef,
  clearSignature,
  handleBack,
  projectRequestId,
  onSent,
}) => {
  const navigate = useNavigate();
  // inside SignProposalTab


  const proposalDataString = Cookies.get("proposal_data") || "";
  const parsedProposalData = proposalDataString ? JSON.parse(proposalDataString) : null;
  const id = parsedProposalData?.data?.id;
  // Server-generated and unique per proposal (e.g. "PROP-2026-0016").
  const proposalNumber = parsedProposalData?.data?.proposalNumber || "";
  const proposalCreatedAt = parsedProposalData?.data?.createdAt;

  const [sendProposalToClient, { isLoading: isSending }] = useSendProposalToClientMutation();
  const architectSigWrapperRef = useResponsiveSignatureCanvas(architectSignatureRef, 150);
  const { data: masterContractArticles } = useGetMasterContractArticlesQuery();
  const articles = masterContractArticles?.data || [];

  // Per-service scope notes state - each service gets its own notes
  const [perServiceNotes, setPerServiceNotes] = useState<Record<string, string[]>>({});
  const [perServiceNewNote, setPerServiceNewNote] = useState<Record<string, string>>({});

  const handleAddServiceNote = (serviceId: string) => {
    const trimmed = (perServiceNewNote[serviceId] || "").trim();
    if (!trimmed) return;
    setPerServiceNotes((prev) => ({
      ...prev,
      [serviceId]: [...(prev[serviceId] || []), trimmed],
    }));
    setPerServiceNewNote((prev) => ({ ...prev, [serviceId]: "" }));
  };

  const handleRemoveServiceNote = (serviceId: string, index: number) => {
    setPerServiceNotes((prev) => ({
      ...prev,
      [serviceId]: (prev[serviceId] || []).filter((_, i) => i !== index),
    }));
  };

  // Serialize all per-service notes into JSON for backend storage
  // Format: { "Service Label": ["note1", "note2"], ... }
  const serializeScopeNotes = (): string | undefined => {
    const entries = Object.entries(perServiceNotes).filter(([, notes]) => notes.length > 0);
    if (entries.length === 0) return undefined;
    const notesByLabel: Record<string, string[]> = {};
    for (const [serviceId, notes] of entries) {
      const objective = objectives.find((o) => o.id === serviceId);
      const label = objective?.label || serviceId;
      notesByLabel[label] = notes;
    }
    return JSON.stringify(notesByLabel);
  };

  // Set once the proposal reaches the client, which swaps this step for the
  // confirmation screen. `emailSent` is reported separately because the
  // proposal is sent even when the notification email bounces.
  const [sentResult, setSentResult] = useState<{ emailSent: boolean } | null>(null);

  const handleSendProposalToClient = async () => {
    if (!id) {
      toast.error("Proposal ID not found. Please try again.");
      return;
    }

    let architectSignature = "";
    if (architectSignatureRef.current && !architectSignatureRef.current.isEmpty()) {
      architectSignature = architectSignatureRef.current.toDataURL("image/png");
    }

    try {
      // Include per-service scope notes in the payload
      const scopeNotesText = serializeScopeNotes();
      const result: any = await sendProposalToClient({ id, architectSignature, scopeNotes: scopeNotesText }).unwrap();
      // The proposal is sent even if the notification email bounces, so report
      // what actually happened rather than a blanket success.
      const emailSent = result?.data?.emailSent !== false;
      if (emailSent) {
        toast.success(result?.message || "Proposal sent to client successfully!");
      } else {
        toast.warning(result?.message || "Proposal sent, but the email could not be delivered.");
      }

      // The wizard is finished with this proposal — drop the draft cookie so a
      // later "Make New Proposal" cannot resume the one just sent.
      Cookies.remove("proposal_data");
      setSentResult({ emailSent });
      onSent?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send proposal");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const scopeNotesText = serializeScopeNotes() || "";

      // Construct a mock contract object for the PDF generator
      const mockContract = {
        proposalNumber,
        createdAt: proposalCreatedAt,
        clientName: `${clientInfo?.firstName || ""} ${clientInfo?.lastName || ""}`.trim() || "Client Name",
        projectLocation: projectInfo?.streetAddress || projectInfo?.location || "Project Location",
        serviceType: projectInfo?.serviceType || "Design Services",
        projectName: projectInfo?.projectName || "New Project",
        notes: scopeNotesText, // Pass the per-service scope notes
        // Drives the generated "3.1 Payment Structure" clause in the PDF.
        paymentMethod,
        services: selectedObjectives.map((id, idx) => ({
          id,
          name: objectives.find((o) => o.id === id)?.label || id,
          amount: objectiveCosts[id] || 0,
          order: objectiveOrders?.[id] ?? idx + 1,
        })),
        architectContractSignature: architectSignatureRef.current?.isEmpty() ? null : architectSignatureRef.current?.toDataURL(),
        architectSignedAt: new Date().toISOString()
      };

      const doc = <ContractPDF contract={mockContract} sections={articles} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposal_${mockContract.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const clientFullName =
    `${clientInfo?.firstName || ""} ${clientInfo?.lastName || ""}`.trim() || "the client";

  if (sentResult) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Congratulations!</h2>
          <p className="text-base text-gray-700 mb-6">
            Your proposal was sent to{" "}
            <span className="font-semibold text-gray-900">{clientFullName}</span>{" "}
            successfully.
          </p>

          <div className="bg-gray-50 rounded-lg p-5 text-left space-y-2 mb-6">
            {proposalNumber && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Proposal</span>
                <span className="text-sm font-mono font-medium text-gray-900">
                  {proposalNumber}
                </span>
              </div>
            )}
            {projectInfo?.projectName && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Project</span>
                <span className="text-sm font-medium text-gray-900 text-right">
                  {projectInfo.projectName}
                </span>
              </div>
            )}
            {clientInfo?.email && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Sent to</span>
                <span className="text-sm font-medium text-gray-900 text-right break-all">
                  {clientInfo.email}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-semibold text-green-700">
                ${totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {sentResult.emailSent ? (
            <p className="text-sm text-gray-500 mb-8">
              The client has been emailed a link to review and sign the contract.
              You'll be notified as soon as they respond.
            </p>
          ) : (
            // Sending succeeded but the notification did not — say so plainly
            // rather than letting the PM assume the client was told.
            <div className="flex items-start gap-3 text-left bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                The proposal is saved and available to the client in their
                dashboard, but the notification email could not be delivered.
                You may want to let them know directly.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() =>
                navigate(
                  projectRequestId
                    ? `/dashboard?project=${projectRequestId}&tab=contracts`
                    : "/dashboard"
                )
              }
              className="bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project Details
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" id="proposal-content">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-2">Architecture Simple</h2>
          <div className="flex justify-between mt-4">
            <div>
              <p className="text-sm font-semibold">Client Name</p>
              <p>
                {clientInfo.firstName} {clientInfo.lastName}
              </p>
              <p>{projectInfo.streetAddress}</p>
            </div>
            <div className="text-right text-sm">
              <p className="">Date:</p>
              <p>
                {proposalCreatedAt
                  ? new Date(proposalCreatedAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </p>
              <p>File No. {proposalNumber || "—"}</p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-4">Subject:</h3>
          <p className="text-sm">Professional Services Proposal</p>
          <p className="text-sm">
            {clientInfo.firstName} {clientInfo.lastName}
            <br />
            {projectInfo.streetAddress}
          </p>
        </div>

        {/* Greeting */}
        <div className="mb-4 text-sm">
          <p className="mb-4">Dear Client,</p>
          <p className="mb-4">
            Architecture Simple is pleased to present this design services
            proposal for the proposed {projectInfo.serviceType} of a
            {projectInfo.projectDescription
              ? ` (${projectInfo.projectDescription})`
              : ""}{" "}
            at {projectInfo.streetAddress}.
          </p>
        </div>





        <div className="text-sm">
          {/* Dynamic Contract Articles from Settings */}


          {/* Project Understanding */}
          <div className="mb-4">
            <h3 className="font-semibold mb-4 text-base">Project Understanding</h3>
            <p className="mb-4 text-sm">
              The Owner would like to build a {projectInfo?.serviceType} on a {projectInfo.city}, {projectInfo.state}.
            </p>
            {projectInfo.projectDescription && (
              <p className="mb-4 text-sm">{projectInfo.projectDescription}</p>
            )}
            {projectInfo.additionalContext && (
              <p className="mb-4 text-sm">{projectInfo.additionalContext}</p>
            )}

            <p>
              Owner has requested this design services proposal from Architecture Simple to provide pre-design, [schematic], [design development], [construction drawings] for the proposed building; coordinate with the owner’s consultant; and provide plan check bidding, construction support, and record drawings.
            </p>
          </div>

          {/* article 1 - Definition  */}
          <div className="mb-8  pt-8">
            <h3 className="text-base font-semibold mb-4">
              Article 1 - Definition
            </h3>
            <p>To establish a clear understanding, the following terms are defined for use throughout this Agreement:</p>
            <ul>
              <li> <strong> "Architect" </strong>refers to Architecture Simple Inc., represented by Eric Rivera, AIA, who will provide professional architectural services as detailed in this Agreement.</li>
              <li>	<strong>"Owner"</strong> refers to {clientInfo?.firstName} {clientInfo?.lastName}, the individual or entity who is entering into this Agreement with the Architect to develop the Project.</li>
              <li>	<strong>"Project"</strong> refers to the construction of a {projectInfo?.serviceType} at {projectInfo.projectDescription} in {projectInfo.city}, {projectInfo.state}, as more specifically described in the Proposal attached hereto.</li>
              <li>	<strong>"Work"</strong> refers to all architectural, engineering, and related professional services required for the design, development, and documentation of the Project, as set forth in the Scope of Services.</li>
              <li>	<strong>“Written Notice”</strong> shall include electronic mail (email), certified mail, or any other documented form of communication acknowledged by both parties.</li>
              <li>  <strong>“Instruments of Service"</strong> refer to all drawings, specifications, calculations, and related materials prepared by the Architect as part of professional services.</li>
              <li>	<strong>"Design Documents"</strong> refers to the completed Schematic Design and Design Development documents, including all drawings, specifications, and other materials prepared by the Architect as part of the development of the Project.</li>
              <li> 	<strong>"Construction Documents" (CDs) </strong> refers to the completed set of final documents that provide the necessary details for construction and permitting, including plans, specifications, and other materials, prepared by the Architect.</li>
              <li>	<strong>"Bidding Documents"</strong> refers to the final, completed Construction Documents and any related documents issued to contractors or bidders.</li>
              <li>	<strong>"Substantial Completion"</strong> means the point in time when the Project is sufficiently complete in accordance with the Contract Documents, allowing the Owner to occupy or utilize the building for its intended use.</li>
              <li> 	<strong>"Completion"</strong> refers to the final completion of all construction work, including punch list items and final inspections, after which the Project is fully delivered to the Owner.</li>
            </ul>
          </div>

          {/* Article 2 - Scope of Services (Specialized section) */}
          <div className="mb-8  pt-8">
            <h3 className="text-base font-semibold mb-4">
              Article 2 - Scope of Services
            </h3>
            <p className="mb-4">
              The Architect agrees to provide the following services for the
              Project as outlined in the Proposal.
            </p>
            {selectedObjectives.length > 0 ? (
              <div className="space-y-6 mb-4">
                {selectedObjectives.map((id) => {
                  const objective = objectives.find((o) => o.id === id);
                  if (!objective) return null;
                  const scopeDesc = getServiceScopeDescription(objective.label);
                  const serviceNotes = perServiceNotes[id] || [];
                  const serviceNewNote = perServiceNewNote[id] || "";

                  return (
                    <div key={id} className="space-y-2 border border-gray-100 rounded-lg p-4">
                      <p className="text-sm font-bold text-gray-900">
                        {scopeDesc ? `${scopeDesc.sectionNumber} ${scopeDesc.title}` : objective.label}
                      </p>
                      {scopeDesc && (
                        <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                          {scopeDesc.bullets.map((bullet, idx) => (
                            <li key={idx} className="leading-relaxed">{bullet}</li>
                          ))}
                        </ul>
                      )}

                      {/* Per-service notes */}
                      {serviceNotes.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-semibold text-gray-600">Additional Notes:</p>
                          {serviceNotes.map((note, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                              <span className="text-xs text-gray-700 flex-1">{idx + 1}. {note}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceNote(id, idx)}
                                className="text-red-400 hover:text-red-600 mt-0.5 flex-shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add note input for this service */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={serviceNewNote}
                          onChange={(e) =>
                            setPerServiceNewNote((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddServiceNote(id);
                            }
                          }}
                          placeholder={`Add a note for ${objective.label}...`}
                          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddServiceNote(id)}
                          disabled={!serviceNewNote.trim()}
                          className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 py-1.5 h-auto"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="italic text-gray-500">
                No services have been selected.
              </p>
            )}
          </div>

          {/* Article 3 - Payment Terms */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Article 3 - Payment Terms
            </h3>
            {/* ... table and details ... */}
            <h4 className="font-semibold mb-2">3.1 Payment Structure</h4>
            <p className="mb-4">
              The total fee shall be (
              {paymentMethod === "lumpSum"
                ? "lump sum"
                : "installments upon task completion"}
              ) for the amount of ${totalCost.toLocaleString()} as follows:
            </p>

            <table className="w-full mb-4 border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left w-20">ORDER #</th>
                  <th className="border p-2 text-left">
                    PROFESSIONAL SERVICES FEE
                  </th>
                  <th className="border p-2 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {selectedObjectives.map((id, idx) => {
                  const objective = objectives.find((o) => o.id === id);
                  return objective ? (
                    <tr key={id}>
                      <td className="border p-2">
                        {objectiveOrders?.[id] ?? idx + 1}
                      </td>
                      <td className="border p-2">{objective.label}</td>
                      <td className="border p-2 text-right">
                        ${objectiveCosts[id]?.toLocaleString() || "0"}
                      </td>
                    </tr>
                  ) : null;
                })}
                {/* ... credits and totals ... */}
              </tbody>
            </table>
          </div>

          {/* Dynamic Contract Articles from Settings (remaining articles after the core sections above) */}
          {articles.length > 0 &&
            articles
              .filter((article: any) => {
                const key = (article.articleKey || "").toLowerCase();
                const title = (article.title || "").toLowerCase();
                // Skip articles already rendered above (definitions, scope, payment)
                const isDefinition = key.includes("definition") || title.includes("definition");
                const isScope = key.includes("scope") || title.includes("scope of services");
                const isPayment = key.includes("payment") || title.includes("payment terms");
                return !isDefinition && !isScope && !isPayment;
              })
              .map((article: any) => (
                <div key={article.id} className="mb-8">
                  <h3 className="text-base font-semibold mb-4">{article.title}</h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
                    {article.content}
                  </div>
                </div>
              ))
          }
        </div>

        {/* Signatures */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Owner (Client) placeholder */}
          <div>
            <h4 className="font-semibold mb-4">OWNER</h4>
            <div className="border border-dashed p-4 mb-4 h-32 flex items-center justify-center bg-gray-50 italic text-gray-400">
              Contract Signature will be captured on client view
            </div>
          </div>

          {/* Architect */}
          <div>
            <h4 className="font-semibold mb-4">ARCHITECT</h4>
            <div ref={architectSigWrapperRef} className="w-full max-w-[430px] border rounded-md overflow-hidden touch-none">
              <SignatureCanvas
                ref={architectSignatureRef}
                canvasProps={{
                  className: "block w-full cursor-crosshair",
                  style: { height: "150px" },
                }}
              />
            </div>
            <div className="flex justify-start gap-4">
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => clearSignature(architectSignatureRef)}
              >
                Clear
              </Button>
            </div>
            <p className="mt-4">Name: Eric Rivera, AIA</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button variant="outline" onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button
            onClick={handleSendProposalToClient}
            disabled={isSending}
            className="bg-slate-700 cursor-pointer hover:bg-slate-800 text-white min-w-[150px]"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Proposal"
            )}
          </Button>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default SignProposalTab;
