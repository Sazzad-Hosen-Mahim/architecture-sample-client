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
}

export default function ConfirmationPage({
  appointmentDate,
  appointmentTime,
  appointmentType,
  projectName,
  clientName,
  clientEmail,
}: ConfirmationPageProps) {
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
                <strong>Date:</strong>{" "}
                {/* {new Date(appointmentDate).toLocaleDateString()} */}
                {appointmentDate
                  ? new Date(appointmentDate).toLocaleDateString()
                  : "Not set"}
              </p>
              <p>
                <strong>Time:</strong> {appointmentTime || "10:00 AM"}
              </p>
              <p>
                <strong>Type:</strong> {appointmentType || "Consultation"}
              </p>
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
