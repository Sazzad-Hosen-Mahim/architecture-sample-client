import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import {
  canAccessSection,
  canEdit,
  isViewOnly,
  sectionsFor,
  type DashboardSection,
} from "@/utils/dashboardAccess";

/**
 * What the signed-in account may see and do in the dashboard.
 *
 * A hook rather than reading the store at each call site so that pages ask the
 * same question the navbar and route guard ask, off the same table — the whole
 * point of `dashboardAccess`.
 *
 * `canEdit` is the one most pages want: drafters and employees read the
 * dashboard, so the controls that write are hidden from them.
 */
export function useDashboardAccess() {
  const user = useAppSelector(selectCurrentUser);

  return {
    user,
    sections: sectionsFor(user),
    canEdit: canEdit(user),
    viewOnly: isViewOnly(user),
    canAccess: (section: DashboardSection) => canAccessSection(user, section),
  };
}

/** Shorthand for the common case: "may this account change anything?" */
export function useCanEdit(): boolean {
  return useDashboardAccess().canEdit;
}
