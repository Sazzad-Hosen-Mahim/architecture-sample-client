import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Accordion } from "@radix-ui/react-accordion";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Download } from "lucide-react";

// Import the custom components from your main file
// Adjust import path as needed

interface OwnerControlsTabProps {
  // Add any props if needed
}

export const OwnerControlsTab: React.FC<OwnerControlsTabProps> = () => {
  const [teamMember, setTeamMember] = useState<string>("");
  const [permissions, setPermissions] = useState({
    mediaAccess: false,
    financialsAccess: false,
    projectAssignment: false,
    viewOnly: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    require2FA: false,
    sessionTimeout: 30,
    defaultEmail: false,
    defaultProjectUpdates: false,
    defaultTaskAssignments: true,
  });

  const [activityLogs, setActivityLogs] = useState({
    startDate: "",
    endDate: "",
  });

  const handlePermissionChange = (
    permission: keyof typeof permissions,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: checked,
    }));
  };

  const handleSystemSettingChange = (
    setting: keyof typeof systemSettings,
    value: boolean | number
  ) => {
    setSystemSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleActivityLogChange = (
    field: keyof typeof activityLogs,
    value: string
  ) => {
    setActivityLogs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePermissions = () => {
    // Handle save permissions logic
    console.log("Saving permissions:", { teamMember, permissions });
  };

  const handleSaveSystemSettings = () => {
    // Handle save system settings logic
    console.log("Saving system settings:", systemSettings);
  };

  const handleExportLogs = () => {
    // Handle export logs logic
    console.log("Exporting logs:", activityLogs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner Controls</CardTitle>
        <CardDescription>
          Manage team access permissions and system-wide settings for your
          organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Access Permissions */}
        <Accordion type="single">
          <AccordionItem value="team-permissions">
            <AccordionTrigger className="text-lg font-medium text-gray-900">
              Team Access Permissions
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="team-member">Select Team Member</Label>
                <Select value={teamMember} onValueChange={setTeamMember}>
                  <SelectTrigger id="team-member">
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="jane-smith">Jane Smith</SelectItem>
                    <SelectItem value="robert-johnson">
                      Robert Johnson
                    </SelectItem>
                    <SelectItem value="emily-davis">Emily Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Access to Media Tab
                    </p>
                    <p className="text-sm text-gray-600">
                      Allow user to access the Media section
                    </p>
                  </div>
                  <Switch
                    id="media-access"
                    checked={permissions.mediaAccess}
                    onCheckedChange={(checked) =>
                      handlePermissionChange("mediaAccess", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Access to Financials Tab
                    </p>
                    <p className="text-sm text-gray-600">
                      Allow user to view financial information
                    </p>
                  </div>
                  <Switch
                    id="financials-access"
                    checked={permissions.financialsAccess}
                    onCheckedChange={(checked) =>
                      handlePermissionChange("financialsAccess", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Project Assignment Capabilities
                    </p>
                    <p className="text-sm text-gray-600">
                      Allow user to assign projects to team members
                    </p>
                  </div>
                  <Switch
                    id="project-assignment"
                    checked={permissions.projectAssignment}
                    onCheckedChange={(checked) =>
                      handlePermissionChange("projectAssignment", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">View-only Mode</p>
                    <p className="text-sm text-gray-600">
                      Restrict user to view-only access
                    </p>
                  </div>
                  <Switch
                    id="view-only"
                    checked={permissions.viewOnly}
                    onCheckedChange={(checked) =>
                      handlePermissionChange("viewOnly", checked)
                    }
                  />
                </div>
              </div>

              <Button
                className="mt-4"
                variant="outline"
                onClick={handleSavePermissions}
              >
                Save Permissions
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* System Settings */}
        <Accordion type="single">
          <AccordionItem value="system-settings">
            <AccordionTrigger className="text-lg font-medium text-gray-900">
              System Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Firm-wide Security Preferences
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Require 2FA for All Users
                    </p>
                    <p className="text-sm text-gray-600">
                      Enforce two-factor authentication for all team members
                    </p>
                  </div>
                  <Switch
                    id="require-2fa"
                    checked={systemSettings.require2FA}
                    onCheckedChange={(checked) =>
                      handleSystemSettingChange("require2FA", checked)
                    }
                  />
                </div>

                <div className="space-y-2 mt-2">
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="session-timeout"
                      type="number"
                      min="5"
                      max="240"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) =>
                        handleSystemSettingChange(
                          "sessionTimeout",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Users will be automatically logged out after this period of
                    inactivity
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Default Notification Settings
                </h4>
                <p className="text-sm text-gray-600">
                  Set default notification preferences for new team members
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Email Notifications
                    </p>
                  </div>
                  <Switch
                    id="default-email"
                    checked={systemSettings.defaultEmail}
                    onCheckedChange={(checked) =>
                      handleSystemSettingChange("defaultEmail", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Project Updates</p>
                  </div>
                  <Switch
                    id="default-project-updates"
                    checked={systemSettings.defaultProjectUpdates}
                    onCheckedChange={(checked) =>
                      handleSystemSettingChange(
                        "defaultProjectUpdates",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Task Assignments
                    </p>
                  </div>
                  <Switch
                    id="default-task-assignments"
                    checked={systemSettings.defaultTaskAssignments}
                    onCheckedChange={(checked) =>
                      handleSystemSettingChange(
                        "defaultTaskAssignments",
                        checked
                      )
                    }
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Activity Logs</h4>
                <p className="text-sm text-gray-600">
                  Export team activity logs for compliance and monitoring
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-start-date">Start Date</Label>
                    <Input
                      id="log-start-date"
                      type="date"
                      value={activityLogs.startDate}
                      onChange={(e) =>
                        handleActivityLogChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-end-date">End Date</Label>
                    <Input
                      id="log-end-date"
                      type="date"
                      value={activityLogs.endDate}
                      onChange={(e) =>
                        handleActivityLogChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={handleExportLogs}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs as CSV
                </Button>
              </div>

              <Button className="mt-4" onClick={handleSaveSystemSettings}>
                Save System Settings
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
