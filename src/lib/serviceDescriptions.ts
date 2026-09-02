/**
 * Service scope descriptions for contract display
 * Maps service names to their section letter, title, and bullet-point descriptions
 */

export interface ServiceScopeBulletGroup {
    /**
     * The bullet's own line. Use "\n" for a hard line break inside it — the
     * renderers preserve them, so one bullet can span several lines without
     * turning into several bullets.
     */
    text: string;
    /**
     * Indented sub-items listed under the bullet with a lighter marker. Use
     * these instead of writing "- Site Plan" as its own top-level bullet.
     */
    subBullets?: string[];
}

/** A bullet is either a plain line or a line with sub-items under it. */
export type ServiceScopeBullet = string | ServiceScopeBulletGroup;

/** Lets renderers treat both bullet shapes the same way. */
export function normalizeBullet(
    bullet: ServiceScopeBullet,
): ServiceScopeBulletGroup {
    return typeof bullet === "string" ? { text: bullet } : bullet;
}

export interface ServiceScopeDescription {
    title: string;
    /**
     * Optional lead-in paragraph rendered above the bullet list, for phases
     * that need prose before the deliverables. Omit it and the service renders
     * as bullets only, exactly as before. Example:
     *
     *   intro: "Based on the approved Schematic Design Documents … Deliverables provided as part of this phase include:",
     *   bullets: ["Refine Architectural Plans", …],
     */
    intro?: string;
    bullets: ServiceScopeBullet[];
}

interface ServiceScopeEntry extends ServiceScopeDescription {
    /** Case-insensitive test against the service name, already lowercased. */
    matches: (name: string) => boolean;
}

/**
 * The scope phases in contract order. The section letter is derived from an
 * entry's position here — first is "A.", second "B.", and so on — so appending
 * a new service to the end of this list gives it the next letter ("I.", "J.",
 * "K." …) with nothing else to update. Reordering the list relabels the
 * sections to match, which is the point: the letters can never drift out of
 * sequence or collide.
 *
 * Order matters for matching too. Entries are tested top to bottom and the
 * first match wins, so a narrower rule must sit above a broader one.
 */
const SERVICE_SCOPES: ServiceScopeEntry[] = [
    {
        matches: (name) => name.includes("assemble"),
        title: "Assemble Information",
        bullets: [
            "Gather project requirements from the Owner.",
            "Research local Authorities Having Jurisdiction (AHJs).",
            "Researching Zoning & Preliminary Building Code Analysis.",
            "Site Visit (1 Max).",
            "Project Scope Verification.",
            "Define and mutually agree upon Program, Schedule and Construction budget.",
            "*Programming is Additional Requirement if Client Does Not Provide*",
        ],
    },
    {
        matches: (name) => name.includes("schematic"),
        title: "Schematic Design (SDs)",
        bullets: [
            {
                text: "Based on the approved Program, Schedule, and Construction Budget from the Assemble Information phase, Architecture Simple Inc. shall prepare, for approval by the Owner, Schematic Design Documents consisting of drawings and other documents illustrating the scale and relationship of the Project. The following sheets provided in this phase shall include:",
                subBullets: [
                    "Site Plan",
                    "Floor Plans",
                    "Roof Plans (If necessary)",
                    "Elevations (If necessary)",
                    "Sections (If necessary)",
                    "Preliminary Building Systems & Material Selection (If necessary)",
                ],
            },
            "Architecture Simple Inc. submit to the Owner a preliminary estimate of Construction Cost based on a cost per square foot basis.",
            "Upon full payment for Schematic Design Services and applicable expenses as described in Article 3, 9, 10, and 12 and written approval of the Schematic Design Drawings, the Design Development phase shall commence.",
        ],
    },
    {
        // Must not swallow "Construction Documents", which also contains "development"
        matches: (name) =>
            (name.includes("design development") || name.includes("development")) &&
            !name.includes("construction"),
        title: "Design Development (DDs)",
        bullets: [
            {
                text: "Based on the approved Schematic Design Documents and any adjustments authorized by the Owner in writing, Architecture Simple Inc. shall prepare Design Development Documents for the Owner’s approval. These documents shall consist of drawings and other documents sufficient to describe the size, scope, and character of the Project, including architectural, structural, mechanical, and electrical systems, and materials. Deliverables provided as part of this phase include:",
                subBullets: [
                    "Refine Architectural Plans",
                    "Coordination with Engineering Consultants",
                    "Building System Selection",
                    "Door and Finish Schedules",
                    "Outline Specifications",
                ],
            },
            "Architecture Simple Inc. shall advise the Owner of any adjustments to the preliminary estimate of Cost of Construction.",
            "Upon full payment for Design Development Services and applicable expenses as described in Articles 3 & 4 and written approval of the Design Development Drawings, the Construction Documents phase shall commence.",
        ],
    },
    {
        matches: (name) =>
            name.includes("construction document") || name.includes("construction doc"),
        title: "Construction Documents (CDs)",
        bullets: [
            "Based on the approved Design Development Documents and any adjustments authorized by the Owner in writing, Architecture Simple Inc. shall prepare Construction Documents consisting of Final Architectural & Engineering Plans, Final Specifications describing in detail the requirements for the construction of the Project.",
            "Architecture Simple Inc. shall advise the Owner of any adjustments to the preliminary estimate of Construction Cost. A revised detailed estimate of Construction Cost, if requested, shall be provided as an Additional Service.",
            "Upon full payment for Construction Documents Services and applicable expenses as described in Articles 3 & 4 and written approval of the Construction Document Drawings, Architecture Simple Inc. shall file the appropriate documents required for the approval of governmental authorities having jurisdiction (if permitting is included within this scope) over the Project. The costs associated with filing shall be the responsibility of the Owner.",
        ],
    },
    {
        matches: (name) => name.includes("ahj") || name.includes("approval"),
        title: "AHJ Approval",
        bullets: [
            "Prepare the necessary plan check submittal documents and submit 95% CDs to the local AHJ.",
            "Revise plans based on AHJ comments and resubmit.",
            "Obtain final approval from the AHJ and transmit 100% CDs permitted plans to the Owner for bidding.",
        ],
    },
    {
        matches: (name) => name.includes("bidding") || name.includes("negotiation"),
        title: "Bidding or Negotiation",
        bullets: [
            "Based on the approved Construction Documents, Architecture Simple Inc. shall assist the Owner in obtaining bids or negotiated proposals and assist in awarding the contracts for construction.",
        ],
    },
    {
        matches: (name) =>
            name.includes("construction support") ||
            name.includes("construction administration") ||
            name.includes("construction admin"),
        title: "Construction Administration (CA)",
        bullets: [
            "Architecture Simple Inc. responsibility to provide Architectural Design Basic Services for the Construction Phase under this agreement commences with the award of the Initial Contract for Construction and terminates at the earlier of the issuance to the Owner of the final Certificate of Payment or 60 days after the date of Substantial Completion of the Work.",
            "Architecture Simple Inc. shall be a representative of and shall advise and consult with the Owner during the administration of the Contract for Construction.",
            "Architecture Simple Inc. shall visit the site at intervals appropriate to the stage of construction and shall keep the Owner informed of the progress and quality of the work. However, Architecture Simple Inc. shall not be required to make exhaustive continuous on-site inspections to check the quality or quantity of the Work. However, Architecture Simple Inc. shall not have control over or charge of and shall not be responsible for construction means, methods, techniques, sequences or procedures, or for safety precautions or programs in connection with the Work, since these are solely the Contractor's responsibility.",
        ],
    },
    {
        matches: (name) =>
            name.includes("record") ||
            name.includes("closeout") ||
            name.includes("close out") ||
            name.includes("close-out"),
        title: "Project Closeout",
        bullets: [
            "Receive red-lined construction drawings from the contractor and prepare final Record Documents.",
            "Submit Record Drawings to the Owner.",
        ],
    },
];

/**
 * 0 -> "A", 25 -> "Z", 26 -> "AA". The wrap-around only matters if a proposal
 * ever carries more than 26 phases, but it keeps every label unique if it does.
 */
export function sectionLetter(index: number): string {
    let remaining = index;
    let letters = "";

    do {
        letters = String.fromCharCode(65 + (remaining % 26)) + letters;
        remaining = Math.floor(remaining / 26) - 1;
    } while (remaining >= 0);

    return letters;
}

/**
 * Returns the scope description for a given service name.
 * Matching is case-insensitive and uses "includes" logic.
 */
export function getServiceScopeDescription(
    serviceName: string,
): ServiceScopeDescription | null {
    const name = serviceName.toLowerCase().trim();
    const entry = SERVICE_SCOPES.find((scope) => scope.matches(name));

    if (!entry) return null;

    const { title, intro, bullets } = entry;
    return { title, intro, bullets };
}

/**
 * The heading a service renders under, e.g. "C. Design Development (DDs)".
 *
 * The letter comes from the service's position in the proposal, not from the
 * SERVICE_SCOPES list, so phases the PM adds by hand ("Flat Reconstruction",
 * "Parking Extension") are lettered too and simply continue the sequence —
 * eight standard phases followed by two custom ones give "I." and "J.".
 * Services with no scope entry fall back to their own name for the title.
 */
export function getServiceSectionHeading(
    index: number,
    serviceName: string,
): string {
    const title = getServiceScopeDescription(serviceName)?.title || serviceName;
    return `${sectionLetter(index)}. ${title}`;
}
