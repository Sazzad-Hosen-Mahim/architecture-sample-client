import { useNavigate, useParams } from "react-router-dom";
import TimesheetEntryFormDialog from "@/components/Deshboard/TimeCardDialog/TimesheetEntryFormDialog";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { landingPathFor } from "@/utils/dashboardAccess";

/**
 * One timesheet, opened straight from a "your timecard was denied"
 * notification so the employee lands on the card that needs correcting.
 *
 * It is deliberately not part of any dashboard section: a timecard is the
 * person's own record, not a Financials page, so this route stays open to
 * whoever the card belongs to. The endpoint behind it refuses a card that
 * isn't yours unless you are a payroll reviewer.
 */
export default function MyTimecard() {
  const { timecardId } = useParams<{ timecardId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  const goBack = () => navigate(landingPathFor(user) ?? "/dashboard");

  if (!timecardId) {
    goBack();
    return null;
  }

  return (
    <TimesheetEntryFormDialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) goBack();
      }}
      timecardId={timecardId}
    />
  );
}
