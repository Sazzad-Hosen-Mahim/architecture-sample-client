// import React from 'react'

// export default function SignProposalTab() {
//   return (
//     <div>SignProposalTab</div>
//   )
// }

import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import React from "react";

interface ProposalSignProps {
  clientInfo: any;
  projectInfo: any;
  selectedObjectives: any[];
  objectives: any[];
  objectiveCosts: Record<string, number>;
  objectiveTimelines: Record<string, number>;
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
  clearSignature: (ref: React.RefObject<SignatureCanvas | null>) => void; // ✅ updated here
  handleSubmit: () => void;
  handleBack: () => void;
  downloadPDF: () => void;
}

const SignProposalTab: React.FC<ProposalSignProps> = ({
  clientInfo,
  projectInfo,
  selectedObjectives,
  objectives,
  objectiveCosts,
  objectiveTimelines,
  credits,
  totalCost,
  finalCost,
  paymentMethod,
  totalWeeks,
  signature,
  setSignature,
  signatureAr,
  setSignatureAr,
  clientSignatureRef,
  architectSignatureRef,
  clearSignature,
  handleSubmit,
  handleBack,
  downloadPDF,
}) => {
  // inside SignProposalTab

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8" id="proposal-content">
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
              <p>{new Date().toLocaleDateString()}</p>
              <p>File No. 25-0001</p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-4">Subject:</h3>
          <p className="text-sm">Professional Services Proposal</p>
          <p className="text-sm">
            {clientInfo.firstName} {clientInfo.lastName}
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

        {/* Project Understanding */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-4">Project Understanding</h3>
          <p className="mb-4 text-sm">
            The project is located in {projectInfo.city}, {projectInfo.state}.
          </p>
          {projectInfo.projectDescription && (
            <p className="mb-4">{projectInfo.projectDescription}</p>
          )}
          {projectInfo.additionalContext && (
            <p className="mb-4">{projectInfo.additionalContext}</p>
          )}
        </div>

        <div className="text-sm">
          {/* Article 1 - Definitions */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Article 1 - Definitions
            </h3>
            <p className="mb-4">
              To establish a clear understanding, the following terms are
              defined for use throughout this Agreement:
            </p>
            <p className="mb-2">
              <strong>"Architect"</strong> refers to Architecture Simple,
              represented by Eric Rivera, AIA, who will provide professional
              architectural services as detailed in this Agreement.
            </p>
            <p className="mb-2">
              <strong>"Owner"</strong> refers to {clientInfo.firstName}{" "}
              {clientInfo.lastName}, the individual or entity who is entering
              into this Agreement with the Architect to develop the Project.
            </p>
            <p className="mb-2">
              <strong>"Project"</strong> refers to the construction of a
              residential building at {projectInfo.streetAddress},{" "}
              {projectInfo.city}, {projectInfo.state} {projectInfo.zip}, as more
              specifically described in the Proposal attached hereto.
            </p>
            <p className="mb-2">
              <strong>"Work"</strong> refers to all architectural, engineering,
              and related professional services required for the design,
              development, and documentation of the Project, as set forth in the
              Scope of Services.
            </p>
            <p className="mb-2">
              <strong>"Design Documents" (DDs)</strong> refers to the completed
              Schematic Design and Design Development documents, including all
              drawings, specifications, and other materials prepared by the
              Architect.
            </p>
            <p className="mb-2">
              <strong>"Construction Documents" (CDs)</strong> refers to the
              completed set of final documents that provide the necessary
              details for construction and permitting, including plans,
              specifications, and other materials.
            </p>
            <p className="mb-2">
              <strong>"Bidding Documents"</strong> refers to the final
              Construction Documents and any related documents issued to
              contractors or bidders.
            </p>
            <p className="mb-2">
              <strong>"Substantial Completion"</strong> means the point in time
              when the Project is sufficiently complete in accordance with the
              Contract Documents, allowing the Owner to occupy or utilize the
              building for its intended use.
            </p>
            <p className="mb-2">
              <strong>"Completion"</strong> refers to the final completion of
              all construction work, including punch list items and final
              inspections.
            </p>
          </div>

          {/* Article 2 - Scope of Services */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Article 2 - Scope of Services
            </h3>
            <p className="mb-4">
              The Architect agrees to provide the following services for the
              Project as outlined in the Proposal.
            </p>
            {selectedObjectives.length > 0 ? (
              <ul className="list-disc pl-6 mb-4">
                {selectedObjectives.map((id) => {
                  const objective = objectives.find((o) => o.id === id);
                  return objective ? (
                    <li key={id} className="mb-2">
                      {objective.label}
                    </li>
                  ) : null;
                })}
              </ul>
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
                  <th className="border p-2 text-left">
                    PROFESSIONAL SERVICES FEE
                  </th>
                  <th className="border p-2 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {selectedObjectives.map((id) => {
                  const objective = objectives.find((o) => o.id === id);
                  return objective ? (
                    <tr key={id}>
                      <td className="border p-2">{objective.label}</td>
                      <td className="border p-2 text-right">
                        ${objectiveCosts[id]?.toLocaleString() || "0"}
                      </td>
                    </tr>
                  ) : null;
                })}
                {selectedObjectives.length === 0 && (
                  <tr>
                    <td className="border p-2">No services selected</td>
                    <td className="border p-2 text-right">$0</td>
                  </tr>
                )}
                {credits.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="border p-2 font-medium">
                        Credits Applied
                      </td>
                    </tr>
                    {credits.map((credit) => (
                      <tr key={credit.id}>
                        <td className="border p-2 pl-4">
                          {credit.description ||
                            (credit.type === "dollar"
                              ? "Dollar Credit"
                              : "Percentage Credit")}
                        </td>
                        <td className="border p-2 text-right text-green-600">
                          -
                          {credit.type === "dollar"
                            ? `$${credit.amount.toLocaleString()}`
                            : `$${(
                                (totalCost * credit.amount) /
                                100
                              ).toLocaleString()} (${credit.amount}%)`}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td className="border p-2 font-bold">GRAND TOTAL</td>
                  <td className="border p-2 text-right font-bold">
                    ${finalCost.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <h4 className="font-semibold mb-2">3.2 Payment Schedule</h4>
            {paymentMethod === "lumpSum" ? (
              <>
                <p className="mb-4">
                  The Owner will pay the full amount upon execution of this
                  Agreement.
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    <strong>Lump Sum Payment:</strong> $
                    {finalCost.toLocaleString()} due at the beginning of the
                    Project.
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="mb-4">
                  The Owner will pay in installments based on completion of each
                  objective.
                </p>
                <table className="w-full mb-4 border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Objective</th>
                      <th className="border p-2 text-right">Payment</th>
                      <th className="border p-2 text-right">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedObjectives.map((id) => {
                      const objective = objectives.find((o) => o.id === id);
                      return objective ? (
                        <tr key={id}>
                          <td className="border p-2">{objective.label}</td>
                          <td className="border p-2 text-right">
                            ${objectiveCosts[id]?.toLocaleString() || "0"}
                          </td>
                          <td className="border p-2 text-right">
                            {objectiveTimelines[id] || "0"} weeks
                          </td>
                        </tr>
                      ) : null;
                    })}
                  </tbody>
                </table>
                <p className="mb-4">
                  <strong>Initial Payment:</strong> 25% ($
                  {Math.round(finalCost * 0.25).toLocaleString()}) due at
                  signing.
                </p>
                <p className="mb-4">
                  <strong>Remaining Payments:</strong> Invoiced per completed
                  objective.
                </p>
              </>
            )}

            <h4 className="font-semibold mb-2">3.3 Payment Terms</h4>
            <p className="mb-4">
              All invoices are due within 30 days. Late payments are subject to
              1.5% monthly interest.
            </p>
          </div>

          {/* Article 4 - Additional Services */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Article 4 - Additional Services
            </h3>
            <p className="mb-4">
              Additional services not specified in the Scope of Services may be
              provided upon request according to the Fee Schedule in Exhibit A.
            </p>
          </div>

          {/* Article 5 - Owner Responsibilities */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Article 5 - Owner's Responsibilities
            </h3>
            <p className="mb-4">The Owner agrees to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                Provide all necessary documents, approvals, and site access.
              </li>
              <li className="mb-2">
                Secure all necessary approvals and permits from the AHJ.
              </li>
              <li className="mb-2">
                Notify the Architect of any scope changes and authorize
                additional services in writing.
              </li>
            </ul>
          </div>

          {/* Project Information */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Project Information
            </h3>
            <p className="mb-2">
              Project Name: {projectInfo.projectName || "[Project Name]"}
            </p>
            <p className="mb-2">Project Number: 25-0001</p>
          </div>

          {/* Signatures */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Owner */}
            <div>
              <h4 className="font-semibold mb-4">OWNER</h4>
              <div className="border border-dashed p-4 mb-4 h-32 flex items-center justify-center">
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700">Owner Signature</label>
                  <input
                    type="text"
                    placeholder="Type your name"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 font-cursive text-base"
                  />
                  {signature.trim() === "" && (
                    <p className="text-gray-400">Owner signature required</p>
                  )}
                </div>
              </div>
              <div className="w-full max-w-[430px]">
                <SignatureCanvas
                  ref={clientSignatureRef}
                  canvasProps={{
                    width: 430,
                    height: 150,
                    className:
                      "border rounded-md w-full h-[150px] sm:h-[150px] md:h-[150px]",
                  }}
                />
              </div>
              <div className="flex justify-between mr-7">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => clearSignature(clientSignatureRef)}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => clearSignature(clientSignatureRef)}
                >
                  Sign
                </Button>
              </div>
              <p className="mt-4">
                Name: {clientInfo.firstName} {clientInfo.lastName}
              </p>
            </div>

            {/* Architect */}
            <div>
              <h4 className="font-semibold mb-4">ARCHITECT</h4>
              <div className="border border-dashed p-4 mb-4 h-32 flex items-center justify-center">
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700">Architect Signature</label>
                  <input
                    type="text"
                    placeholder="Type your name"
                    value={signatureAr}
                    onChange={(e) => setSignatureAr(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 font-cursive text-base"
                  />
                  {signatureAr.trim() === "" && (
                    <p className="text-gray-400">
                      Architect signature required
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full max-w-[430px]">
                <SignatureCanvas
                  ref={architectSignatureRef}
                  canvasProps={{
                    width: 430,
                    height: 150,
                    className:
                      "border rounded-md w-full h-[150px] sm:h-[150px] md:h-[150px]",
                  }}
                />
              </div>
              <div className="flex justify-between mr-7">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => clearSignature(architectSignatureRef)}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => clearSignature(architectSignatureRef)}
                >
                  Sign
                </Button>
              </div>
              <p className="mt-4">Name: Eric Rivera, AIA</p>
            </div>
          </div>

          {/* Article 6 - Schedule + Contact */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Article 6 - Schedule + Contact Information
            </h3>
            <p className="mb-4">
              Architecture Simple will provide services as outlined. The
              estimated timeline is {totalWeeks} weeks.
            </p>

            <h4 className="font-semibold mb-2">Schedule</h4>
            <p className="mb-4">
              Design efforts begin upon acceptance and written notice to
              proceed.
            </p>

            <h4 className="font-semibold mb-2">Contact Information</h4>
            <p className="mb-1">Eric Rivera, AIA, LEED</p>
            <p className="mb-1">Principal, Architecture Simple</p>
            <p className="mb-1">Email: eric@architecturesimple.com</p>
            <p className="mb-4">Phone: +1 (925) 822-4374</p>
          </div>

          {/* Exhibit A */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4">
              Exhibit A: Professional Services Fee Schedule
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">CLASSIFICATION</th>
                  <th className="border p-2 text-right">RATE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Principal</td>
                  <td className="border p-2 text-right">$200.00/Hour</td>
                </tr>
                <tr>
                  <td className="border p-2">Project Architect</td>
                  <td className="border p-2 text-right">$150.00/Hour</td>
                </tr>
                <tr>
                  <td className="border p-2">Project Manager</td>
                  <td className="border p-2 text-right">$130.00/Hour</td>
                </tr>
                <tr>
                  <td className="border p-2">Designer</td>
                  <td className="border p-2 text-right">$110.00/Hour</td>
                </tr>
                <tr>
                  <td className="border p-2">Job Captain</td>
                  <td className="border p-2 text-right">$90.00/Hour</td>
                </tr>
                <tr>
                  <td className="border p-2">CAD Technician</td>
                  <td className="border p-2 text-right">$80.00/Hour</td>
                </tr>
                <tr>
                  <td className="border p-2">Interior Design & Planning</td>
                  <td className="border p-2 text-right">$75.00/Hour</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button variant="outline" onClick={downloadPDF}>
            Download PDF
          </Button>
          <Button variant="outline">Print</Button>
          <Button onClick={handleSubmit}>Send Proposal</Button>
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
