import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import {
  // ArrowLeft,
  Bell,
  Key,
  Shield,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardPenLine,
  FilePenLine,
  User,
  UserCog,
  // Loader2,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";

const OwnerControlsTab = lazy(() =>
  import("@/components/ProfileSetting/OwnerControlsTab").then((module) => ({
    default: module.OwnerControlsTab,
  })),
);
const NotificationSettingsTab = lazy(() =>
  import("@/components/ProfileSetting/NotificationSettingsTab").then(
    (module) => ({ default: module.NotificationSettingsTab }),
  ),
);
const SecuritySettingsCard = lazy(() =>
  import("@/components/ProfileSetting/SecuritySettingsCard").then((module) => ({
    default: module.SecuritySettingsCard,
  })),
);
const MasterScheduleTab = lazy(
  () => import("@/components/ProfileSetting/MasterScheduleTab"),
);
const MasterContractTab = lazy(
  () => import("@/components/ProfileSetting/MasterContractTab"),
);
const AmendmentContractTab = lazy(
  () => import("@/components/ProfileSetting/AmendmentContractTab"),
);

const TabLoader = () => <Loader fullScreen={false} />;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CountrySelect,
  StateSelect,
} from "@/components/Common/LocationSelects";
import { getUserPhoto } from "@/utils/userPhoto";
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
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  stateRegion: string;
  zipCode: string;
  country: string;
  profileImg: string | File;
};

const EMPTY_PROFILE: ProfileData = {
  firstName: "",
  middleInitial: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  streetAddress: "",
  city: "",
  stateRegion: "",
  zipCode: "",
  country: "",
  profileImg: "",
};

export function ProfileSettings() {
  const user = useAppSelector(selectCurrentUser);
  const [updatedProfileInfo] = useUpdatedProfileInfoMutation();
  const dispatch = useAppDispatch();

  // const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");
  const [profilePhoto, setProfilePhoto] = useState<string>(getUserPhoto(user));

  const [profileData, setProfileData] = useState<ProfileData>(EMPTY_PROFILE);

  // when user data becomes available, populate the form
  useEffect(() => {
    if (user) {
      const u = user as any;
      // Fall back to splitting the legacy single `name` for pre-migration rows.
      const nameParts = (u.name || "").trim().split(/\s+/);
      setProfileData({
        firstName: u.firstName || nameParts[0] || "",
        middleInitial: u.middleInitial || "",
        lastName: u.lastName || nameParts.slice(1).join(" ") || "",
        email: u.email || "",
        phoneNumber: u.phoneNumber || "",
        streetAddress: u.streetAddress || "",
        city: u.city || "",
        stateRegion: u.stateRegion || "",
        zipCode: u.zipCode || "",
        country: u.country || "",
        profileImg: getUserPhoto(u),
      });
      setProfilePhoto(getUserPhoto(u));
    }
  }, [user]);

  const isOwner = user?.role === "Owner";
  const isStaff =
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "PROJECT_MANAGER";
  // A client only ever sees Profile / Security / Notifications.
  const isClient = !isOwner && !isStaff;

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

    //   Save file for uploading
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
      const formData = new FormData();
      const textFields: (keyof ProfileData)[] = [
        "firstName",
        "middleInitial",
        "lastName",
        "phoneNumber",
        "streetAddress",
        "city",
        "stateRegion",
        "zipCode",
        "country",
      ];
      textFields.forEach((field) => {
        formData.append(field, (profileData[field] as string) || "");
      });

      if ((profileData.profileImg as any) instanceof File) {
        formData.append("file", profileData.profileImg as any);
      }

      const response: any = await updatedProfileInfo(formData).unwrap();

      if (response?.success && response?.data) {
        const updatedData = response.data;

        // Keep redux in step so the sidebar and avatar update immediately.
        dispatch(updateUser(updatedData));
        if (updatedData.avatar) setProfilePhoto(updatedData.avatar);

        toast.success(response?.message || "Profile updated successfully!");
      } else {
        toast.error(
          response?.message || "Something went wrong while updating.",
        );
      }
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(error?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    tabsContainerRef.current?.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
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
      className={`flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
        isActive
          ? "bg-white border-b-2 border-gray-800"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {children}
    </button>
  );

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-5xl px-4 sm:px-8 md:px-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button> */}
          <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>
        </div>
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
            {/* The tab strip runs past the panel on smaller screens, so it gets
                its own arrows rather than relying on a scrollbar that is hidden
                by design. Padding keeps the first and last tab clear of them. */}
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Scroll tabs left"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/95 hover:bg-white text-gray-600 hover:text-black rounded-full border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div
                ref={tabsContainerRef}
                className="flex space-x-1 bg-gray-100 p-1 px-10 rounded-lg overflow-x-auto scrollbar-hide scroll-smooth"
              >
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
              {/* Scheduling and contract templates are staff-only. */}
              {!isClient && (
                <>
                  <TabButton
                    value="masterSchedule"
                    icon={CalendarDays}
                    isActive={activeTab === "masterSchedule"}
                  >
                    Master Schedule
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
                </>
              )}
              {isOwner && (
                <TabButton
                  value="owner-controls"
                  icon={Key}
                  isActive={activeTab === "owner-controls"}
                >
                  Owner Controls
                </TabButton>
              )}
              </div>
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                aria-label="Scroll tabs right"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/95 hover:bg-white text-gray-600 hover:text-black rounded-full border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Suspense fallback={<TabLoader />}>
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
                    {/* Name row: First / MI / Last */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_1fr] gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleInitial">MI</Label>
                        <Input
                          id="middleInitial"
                          name="middleInitial"
                          value={profileData.middleInitial}
                          onChange={handleProfileChange}
                          maxLength={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileData.email}
                          disabled
                          title="Your sign-in email cannot be changed here"
                          className="bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={profileData.phoneNumber}
                          onChange={handleProfileChange}
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress">Address</Label>
                        <Input
                          id="streetAddress"
                          name="streetAddress"
                          value={profileData.streetAddress}
                          onChange={handleProfileChange}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={profileData.city}
                          onChange={handleProfileChange}
                          placeholder="City"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stateRegion">State/Region</Label>
                        {/* Whatever was saved before stays selected — the value
                            is the state's name either way, and the control falls
                            back to a text box for countries the API has no list
                            for, so an existing entry is never lost. */}
                        <StateSelect
                          id="stateRegion"
                          country={profileData.country}
                          value={profileData.stateRegion}
                          onChange={(value) =>
                            setProfileData((prev) => ({
                              ...prev,
                              stateRegion: value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={profileData.zipCode}
                          onChange={handleProfileChange}
                          placeholder="Zip code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <CountrySelect
                          id="country"
                          value={profileData.country}
                          // Changing country invalidates the saved state.
                          onChange={(value) =>
                            setProfileData((prev) => ({
                              ...prev,
                              country: value,
                              stateRegion:
                                value === prev.country ? prev.stateRegion : "",
                            }))
                          }
                        />
                      </div>
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

            {/* Master Schedule Tab */}
            {!isClient && activeTab === "masterSchedule" && (
              <MasterScheduleTab />
            )}

            {/* Master Contract Tab */}
            {!isClient && activeTab === "masterContract" && (
              <MasterContractTab />
            )}

            {/* Amendment Contract Tab */}
            {!isClient && activeTab === "amendmentContract" && (
              <AmendmentContractTab />
            )}

            {/* Owner Controls Tab - Only visible to owners */}
            {isOwner && activeTab === "owner-controls" && <OwnerControlsTab />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
