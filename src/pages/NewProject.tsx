import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";
import BeginNewProjectSection from "@/components/New project/TabItem/BeginNewProjectSection";
import ClientInfoSection from "@/components/New project/TabItem/ClientInfoSection";
import ConfirmationPage from "@/components/New project/TabItem/ConfirmationPage";
import ProjectDetailsSection from "@/components/New project/TabItem/ProjectDetailsSection";
import ReviewConfirmSection from "@/components/New project/TabItem/ReviewConfirmSection";
import ScheduleAppointmentSection from "@/components/New project/TabItem/ScheduleAppointmentSection";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const sections = [
  "1. Service Details",
  "2. Client Details",
  "3. Project Details",
  "4. Schedule Appointment",
  "5. Review & Confirm",
];

function NewProject() {
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({
    // Client Information
    firstName: "",
    middleInitial: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    // `address` is the key ClientInfoSection and the payload builder use for
    // the client's street address; `streetAddress` below is the legacy name.
    address: "",
    streetAddress: "",
    aptSuiteUnit: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    occupation: "",
    companyName: "",
    referralSource: "",
    previousProjects: "",
    additionalComments: "",

    // Project Details
    projectName: "",
    projectStreetAddress: "",
    projectAptSuiteUnit: "",
    projectCity: "",
    projectState: "",
    projectZipCode: "",
    projectCountry: "",
    serviceType: "",
    squareFootage: "",
    projectDescription: "",
    projectTimeline: "",
    budgetRange: "",
    budgetCurrency: "USD",
    architecturalStyle: "",
    siteConstraints: "",
    sustainabilityGoals: "",
    specialRequirements: "",

    // Appointment Details
    appointmentDate: null,
    appointmentTime: "",
    appointmentType: "",
    appointmentLocation: "",
    appointmentNotes: "",
    meetingLocation: "", // Added meetingLocation field

    // Documents
    propertyBoundarySurveyMap: null,
    additionalProjectPhotos: [],

    // Payment
    paymentMethod: "",
  });
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  // True when the wizard was completed without a logged-in account — the
  // confirmation copy then talks about the signup invite instead of a
  // confirmed appointment.
  const [submittedAnonymously, setSubmittedAnonymously] = useState(false);
  //   const { toast } = useToast();

  const user = useAppSelector(selectCurrentUser) as any;
  // Prefill runs once. Without the guard, a later store update (e.g. saving
  // Profile Settings in another tab) would overwrite what's been typed here.
  const hasPrefilled = useRef(false);

  // The horizontal step strip and its buttons — used to keep the active step
  // scrolled into the centre on narrow screens (see the effect below).
  const tabStripRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // A signed-in client has already given us their details — at sign-up or in
  // Profile Settings — so the Client Information step starts filled in rather
  // than asking for the same thing twice. Anything they change here stays
  // local to this project request.
  useEffect(() => {
    if (!user || hasPrefilled.current) return;
    hasPrefilled.current = true;

    // Older accounts predate the split name columns; fall back to `name`.
    const nameParts = (user.name || "").trim().split(/\s+/);
    const prefill = {
      firstName: user.firstName || nameParts[0] || "",
      middleInitial: user.middleInitial || "",
      lastName: user.lastName || nameParts.slice(1).join(" ") || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      companyName: user.companyName || "",
      // ClientInfoSection and the payload builder both key off `address`.
      address: user.streetAddress || "",
      city: user.city || "",
      state: user.stateRegion || "",
      zipCode: user.zipCode || "",
      country: user.country || "",
    };

    setFormData((prev: any) => {
      const next = { ...prev };
      // Never clobber a field the user already touched, and never write an
      // empty string over an existing default (e.g. country).
      for (const [key, value] of Object.entries(prefill)) {
        if (value && !next[key]) next[key] = value;
      }
      return next;
    });
  }, [user]);

  const updateFormData = (newData: any) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // const goToNextSection = () => {
  //   if (activeSection < sections.length - 1) {
  //     setActiveSection(activeSection + 1);
  //   }
  // };

  const goToPreviousSection = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  // Keep the current step centred in the horizontal step strip, so on a phone
  // you never have to drag the strip by hand to see which step you're on.
  useEffect(() => {
    const strip = tabStripRef.current;
    const activeTab = tabRefs.current[activeSection];
    if (!strip || !activeTab) return;

    const stripRect = strip.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const delta =
      tabRect.left - stripRect.left - strip.clientWidth / 2 + tabRect.width / 2;

    strip.scrollTo({ left: strip.scrollLeft + delta, behavior: "smooth" });
  }, [activeSection]);

  return (
    <div>
      <div className="min-h-screen bg-white text-foreground">
        {/* Fixed header section */}
        <div className="fixed top-[50px] left-0 right-0 bg-white z-20 border-b border-gray-50 ">
          <div className="max-w-4xl mx-auto px-4">
            <div ref={tabStripRef} className="overflow-x-auto">
              <div className="flex space-x-2 md:space-x-4 py-4">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    className={`py-1 px-2 text-xs md:text-[16px] cursor-pointer font-medium whitespace-nowrap transition-colors duration-300 ease-in-out ${
                      index === activeSection
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    onClick={() => setActiveSection(index)}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content area with padding for fixed header */}
        <div className="pt-[70px] pb-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 ">
            {paymentSuccessful ? (
              <ConfirmationPage
                appointmentDate={formData.appointmentDate}
                appointmentTime={formData.appointmentTime}
                appointmentType={formData.appointmentType}
                projectName={formData.projectName}
                clientName={`${formData.firstName} ${formData.lastName}`}
                clientEmail={formData.email}
                isAnonymous={submittedAnonymously}
              />
            ) : (
              <div className="relative">
                {/* Section content */}
                <div className="space-y-8 mt-8">
                  {activeSection === 0 && (
                    <BeginNewProjectSection
                      formData={formData}
                      updateFormData={updateFormData}
                      goToNextSection={() => setActiveSection(1)}
                    />
                  )}
                  {activeSection === 1 && (
                    <ClientInfoSection
                      formData={formData}
                      updateFormData={updateFormData}
                      goToNextSection={() => setActiveSection(2)}
                      goToPreviousSection={goToPreviousSection}
                    />
                  )}
                  {activeSection === 2 && (
                    <ProjectDetailsSection
                      formData={formData}
                      updateFormData={updateFormData}
                      goToNextSection={() => setActiveSection(3)}
                      goToPreviousSection={goToPreviousSection}
                    />
                  )}
                  {activeSection === 3 && (
                    <ScheduleAppointmentSection
                      formData={formData}
                      updateFormData={updateFormData}
                      goToNextSection={() => setActiveSection(4)}
                      goToPreviousSection={goToPreviousSection}
                    />
                  )}
                  {activeSection === 4 && (
                    <ReviewConfirmSection
                      formData={formData}
                      updateFormData={updateFormData}
                      onPaymentSuccess={(anon?: boolean) => {
                        setSubmittedAnonymously(Boolean(anon));
                        setPaymentSuccessful(true);
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-32">
        <HeroSocialMedia />
      </div>
    </div>
  );
}

export default NewProject;
