/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState } from "react";
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
  CountrySelect,
  StateSelect,
  CitySelect,
} from "@/components/Common/LocationSelects";
import {
  validateAppointment,
  hasErrors,
  type ValidationErrors,
} from "@/utils/newProjectValidation";
import { toast } from "sonner";
import { useGetOfficeHoursQuery } from "@/redux/api/adminDashboard/siteSettingsApi";

import {
  formatSlotLabel,
  isWithinOfficeHours,
  startOfDay,
} from "@/utils/scheduleSlots";

/** Appointments are offered on the hour. */
const SLOT_STEP_MINUTES = 60;

/**
 * The hourly slots offered for `day`, labelled in the viewer's local time but
 * limited to the studio's opening window.
 *
 * Every hour of the local day is tested by converting its instant into studio
 * time, rather than reading the window as if it were local. That is what makes
 * a 1pm–8pm California window appear to a Dhaka client as 2am–9am local — the
 * same real hours, written in their clock — instead of showing 1pm–8pm Dhaka
 * and having the server reject every one of them.
 */
const buildSlots = (
  day: Date | undefined,
  officeHours?: { start: string; end: string } | null,
): string[] => {
  if (!day) return [];

  const dayStart = startOfDay(day);
  const slots: string[] = [];

  for (let minutes = 0; minutes < 24 * 60; minutes += SLOT_STEP_MINUTES) {
    const start = new Date(dayStart.getTime() + minutes * 60 * 1000);
    if (!isWithinOfficeHours(start, SLOT_STEP_MINUTES, officeHours)) continue;
    slots.push(formatSlotLabel(minutes));
  }

  return slots;
};

export default function ScheduleAppointmentSection({
  formData,
  updateFormData,
  goToNextSection,
  goToPreviousSection,
}: any) {
  // Date and time are derived straight from the parent's form data — the single
  // source of truth — so picking a time can never wipe the calendar's selection.
  const selectedDate = useMemo(
    () =>
      formData.appointmentDate ? new Date(formData.appointmentDate) : undefined,
    [formData.appointmentDate],
  );
  const selectedTime: string | null = formData.appointmentTime || null;
  const isInPerson = formData.appointmentType === "in-person";

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

    clearError("appointmentDate");
    updateFormData({
      appointmentDate: date.toISOString(),
      appointmentTime: null,
    });
  };

  const handleTimeSelect = (time: string) => {
    clearError("appointmentTime");
    updateFormData({ appointmentTime: time });
  };

  // The bookable window comes from the master schedule (Profile Settings →
  // Master Schedule), so the slots offered here can't contradict the hours the
  // studio actually keeps. The endpoint is public because this wizard is open
  // to visitors without an account.
  const { data: officeHoursResponse, isLoading: isLoadingOfficeHours } =
    useGetOfficeHoursQuery();

  // Recomputed per selected day: which local hours fall inside the studio's
  // window shifts with the date, since California and the viewer can cross
  // daylight-saving boundaries on different days.
  const availableTimes = useMemo(
    () => buildSlots(selectedDate, officeHoursResponse?.data),
    [selectedDate, officeHoursResponse],
  );

  const getAvailableTimes = (_date: Date | undefined) => availableTimes;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  /** Every address control writes straight through to the parent's form data. */
  const handleMeetingField = (name: string, value: string) => {
    clearError(name);
    updateFormData({ [name]: value });
  };

  const handleMeetingCountryChange = (value: string) => {
    // A new country invalidates whichever state/city was picked under the old
    // one, the same way the client and project address blocks behave.
    clearError("meetingCountry");
    updateFormData({
      meetingCountry: value,
      meetingState: "",
      meetingCity: "",
    });
  };

  const EMPTY_MEETING_ADDRESS = {
    meetingStreetAddress: "",
    meetingAptSuiteUnit: "",
    meetingCity: "",
    meetingState: "",
    meetingZipCode: "",
  };

  const handleAppointmentTypeChange = (value: string) => {
    setErrors({});

    // The two types ask for different things, so switching clears whatever the
    // other one had collected — no stale address on a video call, and no slot
    // held against an in-person visit the studio still has to arrange.
    if (value === "in-person") {
      updateFormData({
        appointmentType: value,
        appointmentDate: null,
        appointmentTime: "",
      });
      return;
    }

    updateFormData({ appointmentType: value, ...EMPTY_MEETING_ADDRESS });
  };

  const handleNext = () => {
    // formData is the source of truth here — every field on this step writes
    // straight through to the parent rather than into a local draft.
    const validationErrors = validateAppointment(formData);
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
        {/* Appointment type leads the step: it decides whether the rest of it
            asks for a calendar slot or an address, so asking anything else
            first would mean showing fields that may not apply. */}
        <div>
          <Label htmlFor="appointmentType" className="text-md font-semibold">
            Appointment Type <span className="text-red-500 font-semibold">*</span>
          </Label>
          <Select
            name="appointmentType"
            value={formData.appointmentType}
            onValueChange={handleAppointmentTypeChange}
          >
            <SelectTrigger id="appointmentType" className="mt-2 w-full">
              <SelectValue placeholder="Select appointment type" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300">
              <SelectItem
                value="video-call"
                className="cursor-pointer hover:bg-gray-800 hover:text-white"
              >
                Video Call
              </SelectItem>
              <SelectItem
                value="in-person"
                className="cursor-pointer hover:bg-gray-800 hover:text-white"
              >
                In-person Meeting
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.appointmentType} />
        </div>

        {/* In-person visits are arranged by the studio once it knows where it
            is going, so they pick an address instead of a slot. */}
        {isInPerson ? (
          <div className="space-y-4">
            <h2 className="text-md font-semibold">Meeting Address</h2>

            <div>
              <Label htmlFor="meetingStreetAddress" className="text-xs">
                Street Address{" "}
                <span className="text-red-500 font-semibold">*</span>
              </Label>
              <Input
                id="meetingStreetAddress"
                name="meetingStreetAddress"
                value={formData.meetingStreetAddress || ""}
                onChange={(e) =>
                  handleMeetingField("meetingStreetAddress", e.target.value)
                }
                className="mt-1"
                placeholder="Street address where we should meet"
              />
              <FieldError message={errors.meetingStreetAddress} />
            </div>

            <div>
              <Label htmlFor="meetingAptSuiteUnit" className="text-xs">
                Apt / Suite / Unit
              </Label>
              <Input
                id="meetingAptSuiteUnit"
                name="meetingAptSuiteUnit"
                value={formData.meetingAptSuiteUnit || ""}
                onChange={(e) =>
                  handleMeetingField("meetingAptSuiteUnit", e.target.value)
                }
                className="mt-1"
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="meetingCountry" className="text-xs">
                Country <span className="text-red-500 font-semibold">*</span>
              </Label>
              <div className="mt-1">
                <CountrySelect
                  id="meetingCountry"
                  value={formData.meetingCountry || ""}
                  onChange={handleMeetingCountryChange}
                />
              </div>
              <FieldError message={errors.meetingCountry} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meetingState" className="text-xs">
                  State / Province{" "}
                  <span className="text-red-500 font-semibold">*</span>
                </Label>
                <div className="mt-1">
                  <StateSelect
                    id="meetingState"
                    country={formData.meetingCountry}
                    value={formData.meetingState || ""}
                    onChange={(value) =>
                      handleMeetingField("meetingState", value)
                    }
                  />
                </div>
                <FieldError message={errors.meetingState} />
              </div>

              <div>
                <Label htmlFor="meetingCity" className="text-xs">
                  City <span className="text-red-500 font-semibold">*</span>
                </Label>
                <div className="mt-1">
                  <CitySelect
                    id="meetingCity"
                    value={formData.meetingCity || ""}
                    onChange={(value) => handleMeetingField("meetingCity", value)}
                  />
                </div>
                <FieldError message={errors.meetingCity} />
              </div>
            </div>

            <div>
              <Label htmlFor="meetingZipCode" className="text-xs">
                Zip / Postal Code{" "}
                <span className="text-red-500 font-semibold">*</span>
              </Label>
              <Input
                id="meetingZipCode"
                name="meetingZipCode"
                value={formData.meetingZipCode || ""}
                onChange={(e) =>
                  handleMeetingField("meetingZipCode", e.target.value)
                }
                className="mt-1"
              />
              <FieldError message={errors.meetingZipCode} />
            </div>

            <p className="text-xs text-gray-500">
              We'll confirm a day and time with you by email once we've reviewed
              your project.
            </p>
          </div>
        ) : (
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
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground mt-2">
                Available times will appear here once you select a date.
              </p>
            ) : isLoadingOfficeHours ? (
              <p className="text-sm text-muted-foreground mt-2">
                Loading available times…
              </p>
            ) : getAvailableTimes(selectedDate).length === 0 ? (
              // The window can legitimately be too narrow for a whole hour, and
              // an empty grid would read as a broken form.
              <p className="text-sm text-muted-foreground mt-2">
                No appointment times are open at the moment. Please contact us to
                arrange a consultation.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {getAvailableTimes(selectedDate).map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    className={cn(
                      "relative rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                      selectedTime === time
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50 hover:shadow-sm",
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
            <FieldError message={errors.appointmentTime} />
          </div>

            {selectedDate && selectedTime && (
              <div>
                <h2 className="text-base font-medium mb-6">
                  Selected Appointment
                </h2>
                <p className="text-sm">
                  Date: {selectedDate.toDateString()} at {selectedTime}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
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
