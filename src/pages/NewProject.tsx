import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";
import BeginNewProjectSection from "@/components/New project/TabItem/BeginNewProjectSection";
import ClientInfoSection from "@/components/New project/TabItem/ClientInfoSection";
import ConfirmationPage from "@/components/New project/TabItem/ConfirmationPage";
import ProjectDetailsSection from "@/components/New project/TabItem/ProjectDetailsSection";
import ReviewConfirmSection from "@/components/New project/TabItem/ReviewConfirmSection";
import ScheduleAppointmentSection from "@/components/New project/TabItem/ScheduleAppointmentSection";
import { useState } from "react";

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
  //   const { toast } = useToast();

  const updateFormData = (newData: any) => {
    setFormData({ ...formData, ...newData });
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

  return (
    <div>
      <div className="min-h-screen bg-white text-foreground">
        {/* Fixed header section */}
        <div className="fixed top-[50px] left-0 right-0 bg-white z-20 border-b border-gray-50 ">
          <div className="max-w-7xl mx-auto px-4">
            <div className="overflow-x-auto">
              <div className="flex space-x-2 md:space-x-4 py-4">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    className={`py-1 px-2 text-xs md:text-[16px] cursor-pointer font-medium whitespace-nowrap transition-colors duration-300 ease-in-out ${index === activeSection
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
                      onPaymentSuccess={() => setPaymentSuccessful(true)}
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
