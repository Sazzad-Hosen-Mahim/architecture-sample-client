import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ThumbprintButton from "../ThumbprintButton";
import { Link } from "react-router-dom";

export default function BeginNewProjectSection({
  // formData,
  // updateFormData,
  goToNextSection,
}: any) {
  return (
    <div>
      <div className="pb-2 space-y-1">
        <p className="text-sm md:text-[16px] text-gray-600">
          Welcome to Architecture Simple. We are committed to supporting you
          throughout every phase of your project. To begin, please review the
          comprehensive range of services we offer.
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="basic-services">
            <AccordionTrigger className="text-sm font-medium">
              Basic Services
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="space-y-2 text-[15px]">
                  <h4 className="font-medium">1. Pre-Design (5% of Fee)</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Site Survey (If necessary)</li>
                    <li>Geo-technical Report (If necessary)</li>
                    <li>Site Visit (1 max.)</li>
                    <li>Zoning & Preliminary Building Code Analysis</li>
                    <li>Project Scope Verification</li>
                  </ul>
                  <h4 className="font-medium mt-6">
                    2. Schematic Design (SD) - (20% of Total Fee)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Site Plan</li>
                    <li>Floor Plans</li>
                    <li>Roof Plans (If necessary)</li>
                    <li>Elevations (If necessary)</li>
                    <li>Sections (If necessary)</li>
                    <li>
                      Preliminary Building Systems & Material Selection (If
                      necessary)
                    </li>
                    <li>Preliminary Cost Estimate (Cost/Square Foot) </li>
                  </ul>
                  <h4 className="font-medium mt-6">
                    3. Design Development (DD) - (10% of Total Fee)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Refine Architectural Plans</li>
                    <li>
                      Coordination with Engineering Consultants (Consultants May
                      Vary Depending on Project)
                    </li>
                    <li>In-depth Building System Selection (If necessary)</li>
                    <li>
                      In-depth Material and Finish Selections (If necessary)
                    </li>
                    <li>Schedules (If necessary)</li>
                    <li> Specifications (If necessary)</li>
                    <li>Updated Cost Estimate (Systems and Materials)</li>
                  </ul>
                  <h4 className="font-medium mt-6">
                    4. Construction Documents (CD) - (25% of Total Fee)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Final Architectural Plans</li>
                    <li>
                      Final Engineering Plans (Consultants May Vary Depending on
                      Project)
                    </li>
                    <li>Final Specifications (If necessary)</li>
                    <li>Permit Assistance </li>
                  </ul>
                </div>
                <div className="space-y-2 text-[15px]">
                  <h4 className="font-medium">
                    5. Permit Attainment (PA) - (5% of Total Fee)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      File Initial Application and Necessary Documents to All
                      Authorities Having Jurisdiction (AHJ)
                    </li>
                    <li>
                      Respond to Plan Check Comments Provided by the AHJ (In
                      Collaboration with the Client)
                    </li>
                    <li>
                      Attain Final Permit for Construction and Transmit To
                      Client
                    </li>
                  </ul>
                  <h4 className="font-medium mt-6">
                    6. Bidding Support (BS) - (5% of Total Fee) (If Necessary)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      Assist the Client in Submitted the Permitted Project for
                      Competitive Bidding to General Contractors
                    </li>
                    <li>
                      Attend a Bid Walk with Approved List of General
                      Contractors and Client (1 Max)
                    </li>
                    <li>
                      Review and Answer Bidding Contractor's Questions during
                      the Bidding Period
                    </li>
                    <li>
                      Review Bid Submissions with the Client to Assist in
                      General Contractor Selection
                    </li>
                  </ul>
                  <h4 className="font-medium mt-6">
                    7. Construction Administration (CA) - (25% of Total Fee)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      Attend Construction Site Walks (3 Max) (Additional Visits
                      can be Added at a Flat Fee per the Client's Request)
                    </li>
                    <li>Provide Responses to General Contractor's RFIs</li>
                    <li>
                      Provide Responses to General Contractor's Initiated
                      Submittals
                    </li>
                    <li>
                      Coordinate with the Client and General Contractor on
                      Change Order Request
                    </li>
                    <li>
                      Coordinate with the Client and General Contractor on
                      Construction Change Directives
                    </li>
                    <li>Review General Contractor Initiated Payment Request</li>
                    <li>Attend Substantial Completion Site Walk (1 Max)</li>
                    <li>Attend Final Completion Site Walk (1 Max)</li>
                  </ul>
                  <h4 className="font-medium mt-6">
                    8. Record Drawings (RD) (5% of Total Fee)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Provide Final Record Drawings to the Client</li>
                    <li>Close Out Project</li>
                  </ul>
                </div>
              </div>
              {/* footer  */}
              <div className="mt-10">
                <h1 className="text-[15px] text-gray-700">
                  <span className="font-semibold">Note:</span> Basic Services
                  described above are based on the average project scope from
                  beginning to completion. Each individual project is evaluated
                  independent of the Basic Services and only applicable services
                  necessary to complete the project will be applied.
                </h1>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional-services">
            <AccordionTrigger className="text-[15px] font-medium">
              Additional Services
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-4 space-y-1 text-[15px]">
                <li>Programming (Recommended)</li>
                <li>Client Contracted Consultant Coordination</li>
                <li>Construction Documents (CD) Cost Estimate (Recommended)</li>
                <li>Rendering(s)</li>
                <li>Furniture, Fixtures, and Equipment (FF&amp;E) Selection</li>
                <li>Post Occupancy Evaluation</li>
                <li>Client Request Beyond Basic Services</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional-info">
            <AccordionTrigger className="space-y-1 text-[15px] font-medium">
              Additional Information
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-[15px]">
                Our ultimate goal is to assist the client from concept to
                finished construction in hopes we build a long lasting
                relationships. We value your feedback and encourage you to share
                your thoughts on the project intake form. Please use our
                "Contact Us" page link below to offer your thoughts in helping
                us improve our client relations process.
              </p>
              <br />
              <div className="mt-8 mb-4">
                <div className="mt-auto">
                  <Link to="/contact" className="block">
                    <button className="w-[350px] py-4 px-8 text-black text-lg cursor-pointer font-light tracking-wider uppercase transition-all duration-300 ease-in-out hover:bg-black hover:text-white rounded-md border-2 border-black relative focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50">
                      <span className="relative z-10">Contact Us</span>
                      <span className="absolute inset-2 border border-black rounded-md pointer-events-none"></span>
                    </button>
                  </Link>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-center mt-8">
          <ThumbprintButton onClick={goToNextSection} text="Let's Begin" />
        </div>
      </div>
    </div>
  );
}
