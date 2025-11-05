// import React from "react";

// export default function SecuritySettingsCard() {
//   return <div>SecuritySettingsCard</div>;
// }

"use client";

import React, { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input"; // your custom Input
import { Label } from "@/components/ui/label"; // your custom Label

export function SecuritySettingsCard() {
  const [isLoading, setIsLoading] = useState(false);

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFA: false,
  });

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

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
          <CardTitle>Security Settings</CardTitle>
          <CardDescription className="text-xs mb-4">
            Manage your password and account security settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Change Password */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center text-gray-900">
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </h3>
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={securityData.currentPassword}
                onChange={handleSecurityChange}
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm">
                New Password
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={securityData.newPassword}
                onChange={handleSecurityChange}
                placeholder="Enter your new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={securityData.confirmPassword}
                onChange={handleSecurityChange}
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          {/* <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center text-gray-900">
              <Key className="h-5 w-5 mr-2" />
              Two-Factor Authentication
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Two-factor authentication
                </p>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="2fa"
                checked={securityData.twoFA}
                onCheckedChange={handleToggle2FA}
              />
            </div>
          </div> */}

          <Separator />

          {/* Account Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center text-gray-900">
              <AlertCircle className="h-5 w-5 mr-2" />
              Account Activity
            </h3>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-900">Last sign in</p>
              <p className="text-sm text-gray-600">
                Today, 10:30 AM • IP: 192.168.1.1
              </p>
            </div>
            <Button variant="outline" className="w-full text-xs">
              View all activity
            </Button>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className=" mt-4 bg-gray-800 text-white text-xs hover:bg-black cursor-pointer"
          >
            {isLoading ? "Saving..." : "Update security settings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
