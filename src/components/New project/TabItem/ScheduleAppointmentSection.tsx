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

export default function ScheduleAppointmentSection({
  formData,
  updateFormData,
  goToNextSection,
  goToPreviousSection,
}: any) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.appointmentDate ? new Date(formData.appointmentDate) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    formData.appointmentTime || null
  );
  const [meetingLocation, setMeetingLocation] = useState(
    formData.meetingLocation || ""
  );

  // 🆕 Owner unavailable dates (greyed out)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>(
    formData.unavailableDates || []
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If date is unavailable (greyed out), block selection
    const isUnavailable = unavailableDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
    if (isUnavailable) return;

    setSelectedDate(date);
    setSelectedTime(null);
    updateFormData({
      appointmentDate: date.toISOString(),
      appointmentTime: null,
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    updateFormData({ appointmentTime: time });
  };

  const getAvailableTimes = (date: Date | undefined) => {
    console.log(date);
    return ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  const handleMeetingLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMeetingLocation(e.target.value);
    updateFormData({ meetingLocation: e.target.value });
  };

  // 🆕 Toggle date as unavailable
  const toggleUnavailableDate = (date: Date) => {
    const exists = unavailableDates.find(
      (d) => d.toDateString() === date.toDateString()
    );
    let updatedDates;
    if (exists) {
      updatedDates = unavailableDates.filter(
        (d) => d.toDateString() !== date.toDateString()
      );
    } else {
      updatedDates = [...unavailableDates, date];
    }
    setUnavailableDates(updatedDates);
    updateFormData({ unavailableDates: updatedDates });
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="appointmentDate" className="text-xs">
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
            />
            <div className="text-xs text-gray-500 mt-2">
              Greyed out dates indicate unavailability.
            </div>

            {/* 🆕 Button to mark selected date unavailable */}
            {selectedDate && (
              <Button
                variant="outline"
                className="mt-3 text-xs"
                onClick={() => toggleUnavailableDate(selectedDate)}
              >
                {unavailableDates.some(
                  (d) => d.toDateString() === selectedDate.toDateString()
                )
                  ? "Mark as Available"
                  : "Mark as Unavailable"}
              </Button>
            )}
          </div>

          <div>
            <Label htmlFor="appointmentTime" className="text-xs">
              Select Time
            </Label>
            {selectedDate ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {getAvailableTimes(selectedDate).map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    className="w-full"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Available times will appear here once you select a date.
              </p>
            )}
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
              Appointment Type
            </Label>
            <Select
              name="appointmentType"
              value={formData.appointmentType}
              onValueChange={(value) =>
                updateFormData({ appointmentType: value })
              }
            >
              <SelectTrigger id="appointmentType" className="mt-1 w-full">
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="in-person">In-person Meeting</SelectItem>
                <SelectItem value="video-call">Video Call</SelectItem>
                <SelectItem value="phone-call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.appointmentType === "in-person" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="meetingLocation" className="text-xs">
                  Meeting Location
                </Label>
                <Input
                  id="meetingLocation"
                  name="meetingLocation"
                  value={meetingLocation}
                  onChange={handleMeetingLocationChange}
                  className="mt-1"
                  placeholder="Enter the address for the meeting"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Client will be responsible for representative's travel
                expenses to meeting location.
              </p>
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
          >
            Previous
          </Button>
        </div>
        <div className="flex justify-center mt-8">
          <ThumbprintButton onClick={goToNextSection} text="Review & Confirm" />
        </div>
      </div>
    </div>
  );
}
