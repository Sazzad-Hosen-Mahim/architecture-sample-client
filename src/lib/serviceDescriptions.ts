/**
 * Service scope descriptions for contract display
 * Maps service names to their section number, title, and bullet-point descriptions
 */

export interface ServiceScopeDescription {
    sectionNumber: string;
    title: string;
    bullets: string[];
}

/**
 * Returns the scope description for a given service name.
 * Matching is case-insensitive and uses "includes" logic.
 */
export function getServiceScopeDescription(serviceName: string): ServiceScopeDescription | null {
    const name = serviceName.toLowerCase().trim();

    if (name.includes("assemble")) {
        return {
            sectionNumber: "2.01",
            title: "Assemble Information",
            bullets: [
                "Gather project requirements from the Owner.",
                "Research local Authorities Having Jurisdiction (AHJs).",
            ],
        };
    }

    if (name.includes("schematic")) {
        return {
            sectionNumber: "2.02",
            title: "Schematic Design (SDs)",
            bullets: [
                "Architecture Simple Inc. shall review the program furnished by the Owner in order to understand the scope and requirements of the Project and shall arrive at a mutual understanding of such requirements with the Owner.",
                "Architecture Simple Inc. shall review with the Owner alternative approaches to the design and construction of the project.",
                "Based on the mutually agreed-upon program, Schedule and construction budget requirements, Architecture Simple Inc. shall prepare, for approval by the Owner, Schematic Design Documents consisting of drawings and other documents illustrating the scale and relationship of the Project.",
                "Architecture Simple Inc. submit to the Owner a preliminary estimate of Construction Cost based on a cost per square foot basis.",
                "Upon full payment for Schematic Design Services and applicable expenses as described in Article 3, 9, 10, and 12 and written approval of the Schematic Design Drawings, the Design Development phase shall commence.",
            ],
        };
    }

    if (name.includes("design development") || name.includes("development")) {
        // Make sure it's NOT "construction" to avoid matching "Construction Documents"
        if (!name.includes("construction")) {
            return {
                sectionNumber: "2.03",
                title: "Design Development (DDs)",
                bullets: [
                    "Based on the approved Schematic Design Documents and any adjustments authorized by Owner in writing, Architecture Simple Inc. shall prepare for approval by the Owner, Design Development Documents consisting of drawings and other documents to describe the size and scope of the Project as to architectural, structural, mechanical and electrical systems, and materials.",
                    "Architecture Simple Inc. shall advise the Owner of any adjustments to the preliminary estimate of Cost of Construction.",
                    "Upon full payment for Design Development Services and applicable expenses as described in Articles 3, 9, 10, and 12 and written approval of the Design Development Drawings, the Construction Documents phase shall commence.",
                ],
            };
        }
    }

    if (name.includes("construction document") || name.includes("construction doc")) {
        return {
            sectionNumber: "2.04",
            title: "Construction Documents (CDs)",
            bullets: [
                "Based on the approved Design Development Documents and any adjustments authorized by the Owner in writing, Architecture Simple Inc. shall prepare Construction Documents consisting of Drawings and Specifications describing in detail the requirements for the construction of the Project.",
                "Architecture Simple Inc. shall advise the Owner of any adjustments to the preliminary estimate of Cost of Construction and, as an additional service, submit a revised estimate of Construction Cost.",
                "Upon full payment for Construction Documents Services and applicable expenses as described in Articles 3, 9, and 12 and written approval of the Construction Document Drawings, Architecture Simple Inc. shall file the appropriate documents required for the approval of governmental authorities having jurisdiction over the Project. The costs associated with filing shall be the responsibility of the Owner.",
            ],
        };
    }

    if (name.includes("ahj") || name.includes("approval")) {
        return {
            sectionNumber: "2.05",
            title: "AHJ Approval",
            bullets: [
                "Prepare the necessary plan check submittal documents and submit 95% CDs to the local AHJ.",
                "Revise plans based on AHJ comments and resubmit.",
                "Obtain final approval from the AHJ and transmit 100% CDs permitted plans to the Owner for bidding.",
            ],
        };
    }

    if (name.includes("bidding") || name.includes("negotiation")) {
        return {
            sectionNumber: "2.06",
            title: "Bidding or Negotiation",
            bullets: [
                "Based on the approved Construction Documents, Architecture Simple Inc. shall assist the Owner in obtaining bids or negotiated proposals and assist in awarding the contracts for construction.",
            ],
        };
    }

    if (name.includes("construction support") || name.includes("construction administration") || name.includes("construction admin")) {
        return {
            sectionNumber: "2.07",
            title: "Construction Administration (CA)",
            bullets: [
                "Architecture Simple Inc. responsibility to provide Architectural Design Basic Services for the Construction Phase under this agreement commences with the award of the Initial Contract for Construction and terminates at the earlier of the issuance to the Owner of the final Certificate of Payment or 60 days after the date of Substantial Completion of the Work.",
                "Architecture Simple Inc. shall be a representative of and shall advise and consult with the Owner during the administration of the Contract for Construction.",
                "Architecture Simple Inc. shall visit the site at intervals appropriate to the stage of construction and shall keep the Owner informed of the progress and quality of the work. However, Architecture Simple Inc. shall not be required to make exhaustive continuous on-site inspections to check the quality or quantity of the Work. However, Architecture Simple Inc. shall not have control over or charge of and shall not be responsible for construction means, methods, techniques, sequences or procedures, or for safety precautions or programs in connection with the Work, since these are solely the Contractor's responsibility.",
            ],
        };
    }

    if (name.includes("record") || name.includes("closeout") || name.includes("close out") || name.includes("close-out")) {
        return {
            sectionNumber: "2.08",
            title: "Project Closeout",
            bullets: [
                "Receive red-lined construction drawings from the contractor and prepare final Record Documents.",
                "Submit Record Drawings to the Owner.",
            ],
        };
    }

    return null;
}
