import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import {
  landingPathFor,
  type AccessUser,
  type DashboardSection,
} from "@/utils/dashboardAccess";

const SECTION_LABEL: Record<DashboardSection, string> = {
  studio: "Studio",
  media: "Media",
  financials: "Financials",
};

/**
 * Shown when someone opens a dashboard area their role does not cover — by
 * typing the URL, following an old bookmark, or arriving from a stale link.
 *
 * Deliberately plain about *why* rather than a bare "403": the reader is a
 * colleague who has simply reached the wrong part of the app, and the useful
 * thing is a way back to the part that is theirs.
 */
export default function SectionNotAllowed({
  section,
  user,
}: {
  section: DashboardSection;
  user: AccessUser;
}) {
  const home = landingPathFor(user);
  const roleLabel = (user?.role || "your account")
    .replace(/_/g, " ")
    .toLowerCase();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-5">
        <Lock className="w-7 h-7 text-gray-400" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        {SECTION_LABEL[section]} isn't part of your dashboard
      </h2>

      <p className="mt-2 max-w-md text-sm text-gray-500 leading-relaxed">
        This area isn't available to {roleLabel} accounts. Nothing has gone
        wrong — you've just landed somewhere outside what your role covers. If
        you think you should have access, ask an administrator to update it.
      </p>

      {home ? (
        <Link
          to={home}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Back to your dashboard
        </Link>
      ) : (
        <p className="mt-6 text-xs text-gray-400">
          Your account has no dashboard sections assigned yet.
        </p>
      )}
    </div>
  );
}
