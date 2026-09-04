import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ConfirmationPageProps {
  appointmentDate?: string | null; // allow null
  appointmentTime: string;
  appointmentType: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  /** Submitted without an account — the studio still has to accept the inquiry. */
  isAnonymous?: boolean;
}

export default function ConfirmationPage({
  appointmentDate,
  appointmentTime,
  appointmentType,
  projectName,
  clientName,
  clientEmail,
  isAnonymous,
}: ConfirmationPageProps) {
  if (isAnonymous) {
    return (
      <div>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                Inquiry Submitted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-lg">
                Thank you for choosing Architecture Simple. Your inquiry for "
                {projectName}" has been received and your consultation fee has
                been paid.
              </p>
              <div className="bg-gray-50 p-6 rounded-lg space-y-1">
                <h3 className="font-semibold mb-2">What happens next</h3>
                <p className="text-sm text-gray-700">
                  Our team will review your inquiry. If it's accepted, we'll
                  email <strong>{clientEmail || "you"}</strong> a link to create
                  your account — that's where you'll track the project and
                  confirm your consultation.
                </p>
                <p className="text-sm text-gray-700">
                  If we're unable to take on your project, your consultation fee
                  is refunded in full.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Please check your inbox (and spam folder) over the next few
                days. Questions? Email contactus@architecturesimple.com.
              </p>
              <div className="flex justify-center">
                <Link to="/">
                  <Button className="cursor-pointer bg-gray-800 text-white p-4 hover:bg-black">
                    Home Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              Appointment Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-lg">
              Thank you for choosing Architecture Simple. Your project "
              {projectName}" has been successfully submitted and your
              appointment is confirmed.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Appointment Details:</h3>
              <p>
                <strong>Client Name:</strong> {clientName?.trim() || "Jon Doe"}
              </p>
              <p>
                <strong>Client Email:</strong>{" "}
                {clientEmail || "jondoe@email.com"}
              </p>
              <p>
                <strong>Type:</strong> {appointmentType || "Consultation"}
              </p>
              {/* An in-person visit has no slot yet — the studio arranges it
                  after reviewing the request — so promise the follow-up
                  instead of printing a date that was never picked. */}
              {appointmentDate ? (
                <>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(appointmentDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {appointmentTime || "10:00 AM"}
                  </p>
                </>
              ) : (
                <p>
                  <strong>Date &amp; Time:</strong> We'll confirm these with you
                  by email.
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              We've sent a confirmation email with these details to your
              registered email address. Please check your inbox (and spam
              folder) for the appointment details email. If you need to make any
              changes or have any questions, please don't hesitate to contact
              us.
            </p>
            <div className="flex justify-center">
              <Link to="/">
                <Button>Home Page</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
