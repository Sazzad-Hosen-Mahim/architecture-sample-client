import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface ProjectDeepLink {
  /** Project request to open the details modal for. */
  projectId: string | null;
  /** Tab key to land on inside that modal. */
  tab: string | null;
  /** Proposal to open the contract modal for, once the tab is showing. */
  proposalId: string | null;
}

const DEEP_LINK_PARAMS = ["project", "tab", "proposal"] as const;

const EMPTY: ProjectDeepLink = { projectId: null, tab: null, proposalId: null };

/**
 * Notification deep links arrive as `?project=<id>&tab=<key>&proposal=<id>`.
 *
 * The params are read once into state and then stripped from the URL, so
 * closing the modal - or refreshing the page afterwards - doesn't reopen it,
 * and the back button behaves normally. Other params (Stripe's `?payment=`,
 * for instance) are left untouched.
 */
export function useProjectDeepLink(): ProjectDeepLink & { clear: () => void } {
  const [searchParams, setSearchParams] = useSearchParams();
  const [link, setLink] = useState<ProjectDeepLink>(EMPTY);

  useEffect(() => {
    const projectId = searchParams.get("project");
    if (!projectId) return;

    setLink({
      projectId,
      tab: searchParams.get("tab"),
      proposalId: searchParams.get("proposal"),
    });

    const next = new URLSearchParams(searchParams);
    DEEP_LINK_PARAMS.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return { ...link, clear: () => setLink(EMPTY) };
}
