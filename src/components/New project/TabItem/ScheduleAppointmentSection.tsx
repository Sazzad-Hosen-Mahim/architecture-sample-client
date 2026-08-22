/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import ThumbprintButton from "../ThumbprintButton";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility from shadcn for class merging
import FieldError from "../FieldError";
import {
  validateAppointment,
  hasErrors,
  type ValidationErrors,
} from "@/utils/newProjectValidation";
import { toast } from "sonner";

export default function ScheduleAppointmentSection({
  formData,
  updateFormData,
  goToNextSection,
  goToPreviousSection,
}: any) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.appointmentDate ? new Date(formData.appointmentDate) : undefined,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    formData.appointmentTime || null,
  );
  const [meetingLocation, setMeetingLocation] = useState(
    formData.meetingLocation || "",
  );

  // 🆕 Owner unavailable dates (greyed out)
  const [unavailableDates] = useState<Date[]>(formData.unavailableDates || []);

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Clear a field's error as soon as it's answered.
  const clearError = (name: string) =>
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If date is unavailable (greyed out), block selection
    const isUnavailable = unavailableDates.some(
      (d) => d.toDateString() === date.toDateString(),
    );
    if (isUnavailable) return;

    setSelectedDate(date);
    setSelectedTime(null);
    clearError("appointmentDate");
    updateFormData({
      appointmentDate: date.toISOString(),
      appointmentTime: null,
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    clearError("appointmentTime");
    updateFormData({ appointmentTime: time });
  };

  const getAvailableTimes = (date: Date | undefined) => {
    console.log(date);
    return [
      "8:00 AM",
      "9:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "1:00 PM",
      "2:00 PM",
    ];
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  const handleMeetingLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setMeetingLocation(e.target.value);
    clearError("meetingLocation");
    updateFormData({ meetingLocation: e.target.value });
  };

  const handleAppointmentTypeChange = (value: string) => {
    clearError("appointmentType");
    // Location only applies to in-person meetings, so drop it otherwise
    if (value !== "in-person") {
      clearError("meetingLocation");
      setMeetingLocation("");
      updateFormData({ appointmentType: value, meetingLocation: "" });
      return;
    }
    updateFormData({ appointmentType: value });
  };

  const handleNext = () => {
    // formData is the source of truth here — every field on this step writes
    // straight through to the parent rather than into a local draft.
    const validationErrors = validateAppointment({
      ...formData,
      meetingLocation,
    });
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast.error("Please complete your appointment details before continuing.");
      return;
    }

    goToNextSection();
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="appointmentDate" className="text-md font-semibold">
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={unavailableDates}
              className="mt-2 border-0 rounded-none"
              modifiers={{ unavailable: unavailableDates }}
              modifiersClassNames={{
                unavailable: "border border-red-500 text-gray-400 opacity-50",
              }}
              showOutsideDays={false} // Hide previous/next month dates
            />
            <div className="text-xs text-gray-500 mt-2">
              Greyed out dates indicate unavailability.
            </div>
            <FieldError message={errors.appointmentDate} />
          </div>

          <div>
            <Label htmlFor="appointmentTime" className="text-md font-semibold">
              Select Time
            </Label>
            {selectedDate ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {getAvailableTimes(selectedDate).map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={cn(
                      "relative rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200",
                      selectedTime === time
                        ? "border-primary bg-primary text-black shadow-lg ring-1 ring-primary/20"
                        : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:bg-primary/5 hover:shadow-sm",
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Available times will appear here once you select a date.
              </p>
            )}
            <FieldError message={errors.appointmentTime} />
          </div>
        </div>

        {selectedDate && selectedTime && (
          <div>
            <h2 className="text-base font-medium mb-6">Selected Appointment</h2>
            <p className="text-sm">
              Date: {selectedDate.toDateString()} at {selectedTime}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="appointmentType" className="text-xs">
              Appointment Type{" "}
              <span className="text-red-500 font-semibold">*</span>
            </Label>
            <Select
              name="appointmentType"
              value={formData.appointmentType}
              onValueChange={handleAppointmentTypeChange}
            >
              <SelectTrigger id="appointmentType" className="mt-1 w-full">
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300">
                <SelectItem
                  value="in-person"
                  className="cursor-pointer hover:bg-gray-800 hover:text-white"
                >
                  In-person Meeting
                </SelectItem>
                <SelectItem
                  value="video-call"
                  className="cursor-pointer hover:bg-gray-800 hover:text-white"
                >
                  Video Call
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={errors.appointmentType} />
          </div>

          {formData.appointmentType === "in-person" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="meetingLocation" className="text-xs">
                  Meeting Location{" "}
                  <span className="text-red-500 font-semibold">*</span>
                </Label>
                <Input
                  id="meetingLocation"
                  name="meetingLocation"
                  value={meetingLocation}
                  onChange={handleMeetingLocationChange}
                  className="mt-1"
                  placeholder="Enter the address for the meeting"
                  required
                />
                <FieldError message={errors.meetingLocation} />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="appointmentNotes" className="text-xs">
              Additional Notes for the Appointment
            </Label>
            <Textarea
              id="appointmentNotes"
              name="appointmentNotes"
              value={formData.appointmentNotes}
              onChange={handleInputChange}
              className="mt-1"
              rows={4}
              placeholder="Any specific topics you'd like to discuss or questions you have for the architect?"
            />
          </div>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // save current form data
              goToPreviousSection();
            }}
            className="cursor-pointer border-2 border-black hover:bg-gray-600 hover:border-gray-600 hover:text-white"
          >
            Previous
          </Button>
        </div>
        <div className="flex justify-center mt-8">
          <ThumbprintButton onClick={handleNext} text="Review & Confirm" />
        </div>
      </div>
    </div>
  );
}
