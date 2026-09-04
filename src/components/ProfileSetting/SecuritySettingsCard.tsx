// import React from "react";

// export default function SecuritySettingsCard() {
//   return <div>SecuritySettingsCard</div>;
// }

"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
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
import { useChangePasswordMutation } from "@/redux/api/authApi";
import { useDeleteOwnAccountMutation } from "@/redux/api/userApi";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { signOut } from "@/redux/features/auth/authActions";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

/**
 * A password field with a reveal toggle. All three fields on this card are
 * identical apart from their label and name, so they share one definition
 * rather than repeating the markup and its own visibility state three times.
 */
function PasswordField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={1.8} />
          ) : (
            <Eye size={18} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </div>
  );
}

const MIN_PASSWORD_LENGTH = 8;

export function SecuritySettingsCard() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  // Closing your own account is offered to clients only. Staff accounts are
  // managed by an administrator — a project manager removing themselves would
  // strand their projects and timecards. The server enforces this too.
  const currentUser = useAppSelector(selectCurrentUser) as any;
  const isClient = currentUser?.role === "USER";

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [deleteOwnAccount, { isLoading: isDeleting }] =
    useDeleteOwnAccountMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setDeletePassword("");
    setDeletePasswordConfirm("");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm.");
      return;
    }
    // Typed twice on purpose — this is irreversible, and a typo in a single
    // box would just read as "incorrect password" with no hint why.
    if (deletePassword !== deletePasswordConfirm) {
      toast.error("The passwords do not match.");
      return;
    }

    try {
      const result = await deleteOwnAccount({
        password: deletePassword,
      }).unwrap();
      toast.success(result?.message || "Your account has been closed.");
      closeDeleteDialog();
      dispatch(signOut());
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not close your account.");
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = securityData;

    if (!currentPassword) {
      toast.error("Enter your current password.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(
        `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();
      toast.success(result?.message || "Password updated.");
      setSecurityData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not update your password.");
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
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
            <PasswordField
              id="currentPassword"
              label="Current Password"
              value={securityData.currentPassword}
              onChange={handleSecurityChange}
              placeholder="Enter your current password"
            />
            <PasswordField
              id="newPassword"
              label="New Password"
              value={securityData.newPassword}
              onChange={handleSecurityChange}
              placeholder="Enter your new password"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              value={securityData.confirmPassword}
              onChange={handleSecurityChange}
              placeholder="Confirm your new password"
            />
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
          {/* <div className="space-y-4">
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
          </div> */}
        </CardContent>

        <CardFooter className="flex-col items-start gap-2">
          <Button
            type="submit"
            disabled={isLoading}
            className=" mt-4 bg-gray-800 text-white text-xs hover:bg-black cursor-pointer"
          >
            {isLoading ? "Updating..." : "Update password"}
          </Button>
          <p className="text-xs text-gray-500">
            Changing your password signs you out of your other devices.
          </p>
        </CardFooter>
      </form>

      {/* ─── Close account (clients only) ─── */}
      {isClient && (
        <>
          <Separator />
          <div className="px-6 py-5 space-y-3">
            <h3 className="text-sm font-medium flex items-center text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </h3>
            <p className="text-xs text-gray-600 max-w-xl">
              Closing your account signs you out and removes your profile
              permanently. Your projects, contracts and payment history are kept
              for the studio's records, and any project still running is closed
              off at today's date.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(true)}
              className="text-xs border-red-300 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
            >
              Delete Account
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-4 w-4" />
              Delete your account
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            This cannot be undone. Enter your password twice to confirm.
          </p>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="deletePassword" className="text-sm">
                Password
              </Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletePasswordConfirm" className="text-sm">
                Confirm Password
              </Label>
              <Input
                id="deletePasswordConfirm"
                type="password"
                value={deletePasswordConfirm}
                onChange={(e) => setDeletePasswordConfirm(e.target.value)}
                placeholder="Enter your password again"
              />
              {deletePasswordConfirm &&
                deletePassword !== deletePasswordConfirm && (
                  <p className="text-xs text-red-500">
                    The passwords do not match
                  </p>
                )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={closeDeleteDialog}
              className="flex-1 cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={
                isDeleting ||
                !deletePassword ||
                deletePassword !== deletePasswordConfirm
              }
              className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete my account"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
