import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ThumbprintButton from "../ThumbprintButton";

export default function BeginNewProjectSection({
  // formData,
  // updateFormData,
  goToNextSection,
}: any) {
  return (
    <div>
      <div className="space-y-4 pb-6">
        <p className="text-sm text-gray-600">
          Welcome to Architecture Simple. We are committed to supporting you
          throughout every phase of your project. To begin, we will review the
          comprehensive range of services we offer and outline the scope of work
          involved.
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="basic-services">
            <AccordionTrigger className="text-sm font-medium">
              Basic Services
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-xs">
                <h4 className="font-medium">1. Pre-Design (10% of Fee)</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Site Survey (Client Provided)</li>
                  <li>Geo-technical Report (Client Provided)</li>
                  <li>Site Visit (1 max.))</li>
                  <li>Zoning & Preliminary Building Code Analysis</li>
                  <li>Project Scope Verification</li>
                </ul>
                <h4 className="font-medium">
                  2. Schematic Design (SD) - 20% of Fee
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Site Plan</li>
                  <li>Floor Plans</li>
                  <li>Roof Plans</li>
                  <li>Elevations</li>
                  <li>Sections</li>
                  <li>Preliminary Building Systems & Material Selection</li>
                  <li>Preliminary Cost Estimate (Cost/Square Foot) </li>
                </ul>
                <h4 className="font-medium">
                  3. Design Development (DD) - 25% of Fee
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Develop Architectural Plans (Plans, Elevations, Sections,
                    Details)
                  </li>
                  <li>
                    Coordination with Engineering Consultants (Consultants May
                    Vary Depending on Project)
                  </li>
                  <li>In-depth Building System Selection</li>
                  <li>In-depth Material and Finish Selections</li>
                  <li>Schedules</li>
                  <li> Specifications </li>
                  <li>Updated Cost Estimate (Systems and Materials)</li>
                </ul>
                <h4 className="font-medium">
                  4. Construction Documents (CD) - 35% of Fee
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Final Architectural Plans</li>
                  <li>Final Engineering Plans</li>
                  <li>Final Specifications</li>
                  <li>Permit Assistance </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional-services">
            <AccordionTrigger className="text-sm font-medium">
              Additional Services
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                <li>Programming (Recommended)</li>
                <li>Client Contracted Consultant Coordination</li>
                <li>Construction Documents (CD) Cost Estimate (Recommended)</li>
                <li>
                  Assist Client in Bidding/Procurement (Highly Recommended)
                </li>
                <li>Construction Administration (Highly Recommended)</li>
                <li>Rendering(s)</li>
                <li>Furniture, Fixtures, and Equipment (FF&amp;E) Selection</li>
                <li>Post Occupancy Evaluation</li>
                <li>Client Request Beyond Basic Services</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional-info">
            <AccordionTrigger className="text-sm font-medium">
              Additional Information
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Architecture Simple aims to provide assistance on client
                provided items as an additional service. Our ultimate goal is to
                assist the client from concept to finished construction in hopes
                to build long lasting client + architect relationships.
              </p>
              <br />
              <p>
                We value your feedback and encourage you to share your thoughts
                on the project intake form. Please use our "Contact Us" page
                link below to offer your thoughts in helping us improve our
                client relations process.
              </p>
              <div className="mt-8 mb-4">
                <a
                  href="/contact"
                  className="text-black px-6 py-3 border border-gray-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact Us
                </a>
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
