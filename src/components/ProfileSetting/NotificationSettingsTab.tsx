import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser, updateUser } from "@/redux/features/auth/authSlice";
import {
  useUpdateNotificationPreferencesMutation,
  type NotificationPreferences,
} from "@/redux/features/ProfileSettings/profileSettings";

const PREFERENCES: {
  id: keyof NotificationPreferences;
  title: string;
  description: string;
}[] = [
  {
    id: "emailNotifications",
    title: "Email Notifications",
    description: "Receive notifications via email",
  },
  {
    id: "projectUpdates",
    title: "Project Updates",
    description:
      "Phase changes, deliverables ready to view, payments due, and meeting times",
  },
  {
    id: "securityAlerts",
    title: "Security Alerts",
    description: "Password changes and other security events",
  },
];

export function NotificationSettingsTab() {
  const user = useAppSelector(selectCurrentUser) as any;
  const dispatch = useAppDispatch();
  const [savePreferences, { isLoading }] =
    useUpdateNotificationPreferencesMutation();

  const [settings, setSettings] = useState<NotificationPreferences>({
    emailNotifications: true,
    projectUpdates: true,
    securityAlerts: true,
  });

  // Hydrate from the saved user record rather than defaulting every visit.
  useEffect(() => {
    if (user) {
      setSettings({
        emailNotifications: user.emailNotifications ?? true,
        projectUpdates: user.projectUpdates ?? true,
        securityAlerts: user.securityAlerts ?? true,
      });
    }
  }, [user]);

  const handleChange = (name: keyof NotificationPreferences, checked: boolean) =>
    setSettings((prev) => ({ ...prev, [name]: checked }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await savePreferences(settings).unwrap();
      if (res?.data) dispatch(updateUser(res.data));
      toast.success(res?.message || "Notification preferences saved");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save preferences");
    }
  };

  const Switch = ({
    checked,
    onCheckedChange,
  }: {
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      // shrink-0 because this sits in a flex row: `w-11` is only a preferred
      // width, and a flex item shrinks by default. Beside a description long
      // enough to wrap, the track was squeezed down to about the width of its
      // own knob and read as a black blob rather than a switch.
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-gray-800" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREFERENCES.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between gap-4">
                {/* min-w-0 so the description wraps instead of holding the row
                    open: a flex item's default min-width is its content, which
                    is what left no room for the switch. */}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={settings[item.id]}
                  onCheckedChange={(checked) => handleChange(item.id, checked)}
                />
              </div>
              {idx < PREFERENCES.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gray-800 text-white mt-4 cursor-pointer hover:bg-black"
          >
            {isLoading ? "Saving..." : "Save notification preferences"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
