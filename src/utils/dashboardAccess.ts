/**
 * Which parts of the staff dashboard each account may open.
 *
 * One table, used by both the navbar (to decide which tabs to render) and the
 * layout guard (to decide whether a typed-in URL is allowed). Keeping them on
 * the same source is the point: hiding a tab while leaving its route reachable
 * is not access control, it is decoration.
 *
 * This is a convenience for the person using the app, not a security boundary.
 * Every endpoint behind these pages carries its own `@Roles` guard, and that is
 * what actually protects the data.
 */
export type DashboardSection = "studio" | "media" | "financials";

export const ALL_SECTIONS: DashboardSection[] = [
  "studio",
  "media",
  "financials",
];

/** The shape this module needs off the signed-in user. */
export type AccessUser = {
  role?: string | null;
  /** Only meaningful for EMPLOYEE; ignored for every other role. */
  dashboardSections?: string[] | null;
} | null;

const ACCESS_BY_ROLE: Record<string, DashboardSection[]> = {
  // Root admin — everything, always.
  SUPER_ADMIN: ALL_SECTIONS,
  ADMIN: ALL_SECTIONS,
  HIGHER_MANAGER: ALL_SECTIONS,

  // Single-area roles.
  PROJECT_MANAGER: ["studio"],
  FINANCE: ["financials"],
  MEDIA_MANAGER: ["media"],

  // Drafters read the studio but change nothing there.
  DRAFTER: ["studio"],

  // Employees are the exception: their sections are ticked per person when the
  // account is created, so they are read off the account rather than from here.
  EMPLOYEE: [],

  // Clients never reach the staff dashboard at all.
  USER: [],
};

/** Roles that may read a section but not change anything in it. */
const VIEW_ONLY_ROLES = new Set(["DRAFTER", "EMPLOYEE"]);

/** Every route under `/dashboard`, mapped to the section that owns it. */
const SECTION_BY_PATH: { prefix: string; section: DashboardSection }[] = [
  { prefix: "/dashboard/media", section: "media" },

  { prefix: "/dashboard/financials", section: "financials" },
  { prefix: "/dashboard/employees", section: "financials" },
  { prefix: "/dashboard/timecards", section: "financials" },
  { prefix: "/dashboard/adjust-rates", section: "financials" },
  { prefix: "/dashboard/refund-requests", section: "financials" },
  { prefix: "/dashboard/consultation-refunds", section: "financials" },

  { prefix: "/dashboard/new-proposal", section: "studio" },
  { prefix: "/dashboard/new-inquiries", section: "studio" },
  { prefix: "/dashboard/new-inquiries-list", section: "studio" },
  { prefix: "/dashboard/proposals", section: "studio" },
  { prefix: "/dashboard/teams", section: "studio" },
  { prefix: "/dashboard/client-users", section: "studio" },
  { prefix: "/dashboard/archived-projects", section: "studio" },
];

const isSection = (value: string): value is DashboardSection =>
  (ALL_SECTIONS as string[]).includes(value);

/**
 * The sections this account may open.
 *
 * For an EMPLOYEE this is whatever was ticked on their team-member record —
 * empty until someone ticks something, which is the safe way round for a
 * dashboard carrying payroll figures. Every other role reads from the table.
 */
export const sectionsFor = (user: AccessUser): DashboardSection[] => {
  const role = user?.role ?? "";
  if (role === "EMPLOYEE") {
    return (user?.dashboardSections ?? []).filter(isSection);
  }
  return ACCESS_BY_ROLE[role] ?? [];
};

export const canAccessSection = (
  user: AccessUser,
  section: DashboardSection,
): boolean => sectionsFor(user).includes(section);

/**
 * Roles that may look at a section but not change it. Drafters and employees
 * read the dashboard; the buttons that write are hidden from them.
 */
export const isViewOnly = (user: AccessUser): boolean =>
  VIEW_ONLY_ROLES.has(user?.role ?? "");

/** Convenience inverse — reads better at the call sites that gate an action. */
export const canEdit = (user: AccessUser): boolean => !isViewOnly(user);

/**
 * The section a dashboard path belongs to. `/dashboard` itself is the studio
 * landing page; anything unrecognised returns null and is left alone rather
 * than blocked, so a new route is never locked out by being forgotten here.
 */
export const sectionOfPath = (pathname: string): DashboardSection | null => {
  // Longest prefix first, so `/dashboard/new-inquiries-list` isn't shadowed by
  // a shorter entry that happens to sit earlier in the list.
  const match = [...SECTION_BY_PATH]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find(
      (entry) =>
        pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
    );
  if (match) return match.section;
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "studio";
  return null;
};

/** Where to send someone who lands on a section they cannot open. */
export const landingPathFor = (user: AccessUser): string | null => {
  const sections = sectionsFor(user);
  if (sections.includes("studio")) return "/dashboard";
  if (sections.includes("media")) return "/dashboard/media";
  if (sections.includes("financials")) return "/dashboard/financials";
  return null;
};
