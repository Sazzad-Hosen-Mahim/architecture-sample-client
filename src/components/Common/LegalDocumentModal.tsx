import { Suspense, lazy } from "react";
import { Loader2, X } from "lucide-react";

// Lazily loaded: between them these two pages are a few hundred lines of legal
// copy that nobody reads on most visits, and the signup form should not carry
// that weight just in case.
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));

export type LegalDocument = "terms" | "privacy";

const TITLES: Record<LegalDocument, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
};

/**
 * Terms of Service / Privacy Policy shown over whatever the reader was doing.
 *
 * A modal rather than a link away, so someone part-way through the signup form
 * can read the terms and come straight back to a form that still has
 * everything they typed — navigating to the page and back would empty it.
 *
 * The real page components are rendered as-is; the copy is not duplicated here,
 * so the modal and the standalone pages can never drift apart.
 */
export default function LegalDocumentModal({
  document,
  onClose,
}: {
  document: LegalDocument;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={TITLES[document]}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden"
        // The backdrop closes on click; the panel must not pass that through.
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {TITLES[document]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            }
          >
            {document === "terms" ? <Terms /> : <Privacy />}
          </Suspense>
        </div>

        <div className="px-6 py-4 border-t border-gray-300 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 cursor-pointer"
          >
            Back to sign up
          </button>
        </div>
      </div>
    </div>
  );
}
