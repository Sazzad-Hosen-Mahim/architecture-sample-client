// import React from "react";

// export default function NotificationSettingsTabTab() {
//   return <div>NotificationSettingsTabTab</div>;
// }

import { useState } from "react";
import { Button } from "@/components/ui/button"; // Or your custom Button
import { Separator } from "@/components/ui/separator"; // Or your custom Separator
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"; // Or your custom Card components

export function NotificationSettingsTab() {
  const [isLoading, setIsLoading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    taskAssignments: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  // Toggle handler
  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }));
  };

  // Custom Switch component
  const Switch = ({
    // id,
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 1000); // simulate save
        }}
      >
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: "emailNotifications",
              title: "Email Notifications",
              description: "Receive notifications via email",
            },
            {
              id: "projectUpdates",
              title: "Project Updates",
              description: "Get notified about changes to your projects",
            },
            {
              id: "taskAssignments",
              title: "Task Assignments",
              description: "Get notified when you're assigned to a task",
            },
            {
              id: "securityAlerts",
              title: "Security Alerts",
              description: "Get notified about security events",
            },
            {
              id: "marketingEmails",
              title: "Marketing Emails",
              description: "Receive marketing and promotional emails",
            },
          ].map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={
                    notificationSettings[
                      item.id as keyof typeof notificationSettings
                    ]
                  }
                  onCheckedChange={(checked) =>
                    handleNotificationChange(item.id, checked)
                  }
                />
              </div>
              {idx < 4 && <Separator />}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save notification preferences"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
