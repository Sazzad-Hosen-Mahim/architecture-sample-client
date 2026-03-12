import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Key,
  LogOut,
  Shield,
  ClipboardPenLine,
  FilePenLine,
  User,
  UserCog,
  Archive,
} from "lucide-react";
import { OwnerControlsTab } from "@/components/ProfileSetting/OwnerControlsTab";
import { ArchivedProjectsTab } from "@/components/ProfileSetting/ArchivedProjectsTab";
import { NotificationSettingsTab } from "@/components/ProfileSetting/NotificationSettingsTab";
import { SecuritySettingsCard } from "@/components/ProfileSetting/SecuritySettingsCard";
import MasterContractTab from "@/components/ProfileSetting/MasterContractTab";
import AmendmentContractTab from "@/components/ProfileSetting/AmendmentContractTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser, updateUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import { useUpdatedProfileInfoMutation } from "@/redux/features/ProfileSettings/profileSettings";

type ProfileData = {
  name: string;
  phone: string;
  company: string;
  bio: string;
  profileImg: string | File;
};

export function ProfileSettings() {
  const user = useAppSelector(selectCurrentUser);
  const [updatedProfileInfo] = useUpdatedProfileInfoMutation();
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");
  const [profilePhoto, setProfilePhoto] = useState<string>(user?.imagUrl || "");

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    phone: "",
    company: "",
    bio: "",
    profileImg: "",
  });

  // when user data becomes available, populate the form
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user?.name || "",
        phone: user?.phoneNumber || "",
        company: user?.companyName || "",
        bio: user?.bio || "",
        profileImg: user?.imagUrl || "",
      });
      setProfilePhoto(user?.imagUrl || "");
    }
  }, [user]);

  const isOwner = user?.role === "Owner";
  const isStaff = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "PROJECT_MANAGER";

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsLoading(true);

    // Preview image
    const imageUrl = URL.createObjectURL(file);
    setProfilePhoto(imageUrl);

    // ✅ Save file for uploading
    setProfileData((prev) => ({
      ...prev,
      profileImg: file, // <-- Store the actual File object
    }));

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  // handel submit  function

  // Inside your component:

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build FormData as per Swagger
      const formData = new FormData();
      formData.append("name", profileData.name || "");
      formData.append("bio", profileData.bio || "");
      formData.append("phoneNumber", profileData.phone || "");
      formData.append("companyName", profileData.company || "");

      if ((profileData.profileImg as any) instanceof File) {
        formData.append("file", profileData.profileImg as any);
      }

      console.log(
        "FormData before submit:",
        Object.fromEntries(formData.entries())
      );

      // Call RTK Mutation
      const response: any = await updatedProfileInfo(formData).unwrap();
      console.log("Profile update response:", response);

      if (response?.success && response?.data) {
        const updatedData = response.data;
        console.log("i am comming data for dispatch", updatedData);

        // ✅ Update redux user data with new info
        dispatch(
          updateUser({
            name: updatedData.name,
            bio: updatedData.bio,
            imagUrl: updatedData.imagUrl, // backend key (check spelling)
            phoneNumber: updatedData.phoneNumber,
            companyName: updatedData.companyName,
          })
        );

        toast.success(response?.message || "Profile updated successfully!");
      } else {
        toast.error(
          response?.message || "Something went wrong while updating."
        );
      }
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(error?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Handle logout logic
  };

  // Custom Tabs Components
  const TabButton = ({
    value,
    icon: Icon,
    children,
    isActive,
  }: {
    value: string;
    icon: any;
    children: React.ReactNode;
    isActive: boolean;
  }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
        ? "bg-white border-b-2 border-gray-800"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {children}
    </button>
  );

  return (
    <div className="container mx-auto py-6 max-w-5xl md:px-0 px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border">
                    <AvatarImage src={profilePhoto} alt={user?.name} />
                    <AvatarFallback className="text-lg">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-photo"
                    className="absolute bottom-0 right-0 bg-gray-800 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700"
                  >
                    <UserCog className="h-4 w-4" />
                    <input
                      id="profile-photo"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg text-gray-900">
                    {user?.name}
                  </h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <h3 className="font-medium text-sm text-gray-900">
                    Role: {user?.role}
                  </h3>
                </div>
                <Separator />
                <div className="w-full">
                  <div className="text-sm text-gray-500 mb-2">
                    Account Status
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Active</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <TabButton
                value="profile"
                icon={User}
                isActive={activeTab === "profile"}
              >
                Profile
              </TabButton>
              <TabButton
                value="security"
                icon={Shield}
                isActive={activeTab === "security"}
              >
                Security
              </TabButton>
              <TabButton
                value="notifications"
                icon={Bell}
                isActive={activeTab === "notifications"}
              >
                Notifications
              </TabButton>
              <TabButton
                value="masterContract"
                icon={ClipboardPenLine}
                isActive={activeTab === "masterContract"}
              >
                Master Contract
              </TabButton>
              <TabButton
                value="amendmentContract"
                icon={FilePenLine}
                isActive={activeTab === "amendmentContract"}
              >
                Amendment Contract
              </TabButton>
              {isOwner && (
                <TabButton
                  value="owner-controls"
                  icon={Key}
                  isActive={activeTab === "owner-controls"}
                >
                  Owner Controls
                </TabButton>
              )}
              {isStaff && (
                <TabButton
                  value="archives"
                  icon={Archive}
                  isActive={activeTab === "archives"}
                >
                  Archives
                </TabButton>
              )}
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <form onSubmit={handleProfileUpdate}>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription className="text-xs mb-6">
                    Update your personal information and how others see you on
                    the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                      />
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="Your email address"
                      />
                    </div> */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={profileData.company}
                        onChange={handleProfileChange}
                        placeholder="Your company"
                      />
                    </div>
                  </div>
                  {/* <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      name="role"
                      value={profileData.role}
                      onChange={handleProfileChange}
                      placeholder="Your role"
                    />
                  </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      placeholder="Tell us about yourself"
                      className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-800 text-white mt-4 cursor-pointer  hover:bg-black"
                  >
                    {isLoading ? "Saving..." : "Save changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && <SecuritySettingsCard />}

          {/* Notifications Tab */}
          {activeTab === "notifications" && <NotificationSettingsTab />}

          {/* Master Contract Tab */}
          {activeTab === "masterContract" && <MasterContractTab />}

          {/* Amendment Contract Tab */}
          {activeTab === "amendmentContract" && <AmendmentContractTab />}

          {/* Owner Controls Tab - Only visible to owners */}
          {isOwner && activeTab === "owner-controls" && <OwnerControlsTab />}

          {/* Archived Projects Tab - Only visible to staff */}
          {isStaff && activeTab === "archives" && <ArchivedProjectsTab />}
        </div>
      </div>
    </div>
  );
}
