/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Validation rules for the New Project wizard.
 *
 * Each step validates its own fields so the client is stopped at the step that
 * has the problem, and `validateProjectRequest` re-runs everything before
 * submit — the step buttons can be skipped by clicking the tab strip, so the
 * review step cannot assume the earlier steps were ever validated.
 *
 * Required here mirrors what the backend needs: the fields marked required on
 * `CreateProjectRequestDto` plus the ones the studio can't work without.
 */

export type ValidationErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || String(value).trim() === "";

export function validateClientInfo(data: any): ValidationErrors {
  const errors: ValidationErrors = {};

  if (isBlank(data?.firstName)) {
    errors.firstName = "First name is required";
  } else if (String(data.firstName).trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }

  if (isBlank(data?.lastName)) {
    errors.lastName = "Last name is required";
  } else if (String(data.lastName).trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
  }

  if (isBlank(data?.email)) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(String(data.email).trim())) {
    errors.email = "Enter a valid email address";
  }

  if (isBlank(data?.phone)) {
    errors.phone = "Phone number is required";
  } else if (String(data.phone).replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a valid phone number";
  }

  if (isBlank(data?.address)) errors.address = "Street address is required";
  if (isBlank(data?.country)) errors.country = "Country is required";
  if (isBlank(data?.state)) errors.state = "State / province is required";
  if (isBlank(data?.zipCode)) errors.zipCode = "Zip / postal code is required";

  return errors;
}

export function validateProjectDetails(data: any): ValidationErrors {
  const errors: ValidationErrors = {};

  if (isBlank(data?.projectName)) {
    errors.projectName = "Project name is required";
  } else if (String(data.projectName).trim().length < 3) {
    errors.projectName = "Project name must be at least 3 characters";
  }

  if (isBlank(data?.projectStreetAddress))
    errors.projectStreetAddress = "Street address is required";
  if (isBlank(data?.projectCountry))
    errors.projectCountry = "Country is required";
  if (isBlank(data?.projectState))
    errors.projectState = "State / province is required";
  if (isBlank(data?.projectCity)) errors.projectCity = "City is required";
  if (isBlank(data?.projectZipCode))
    errors.projectZipCode = "Zip code is required";

  if (isBlank(data?.serviceType)) {
    errors.serviceType = "Service type is required";
  } else if (data.serviceType === "consultation" && isBlank(data?.serviceTypeOther)) {
    // "consultation" is the select value behind the "Other" option
    errors.serviceTypeOther = "Please specify the service type";
  }

  if (isBlank(data?.projectType)) {
    errors.projectType = "Project type is required";
  } else if (data.projectType === "other" && isBlank(data?.projectTypeOther)) {
    errors.projectTypeOther = "Please specify the project type";
  }

  if (isBlank(data?.squareFootage)) {
    errors.squareFootage = "Project size is required";
  } else if (Number(data.squareFootage) <= 0 || Number.isNaN(Number(data.squareFootage))) {
    errors.squareFootage = "Enter a project size greater than 0";
  }

  if (isBlank(data?.budgetRange)) errors.budgetRange = "Budget range is required";

  return errors;
}

export function validateAppointment(data: any): ValidationErrors {
  const errors: ValidationErrors = {};

  if (isBlank(data?.appointmentDate))
    errors.appointmentDate = "Please select an appointment date";
  if (isBlank(data?.appointmentTime))
    errors.appointmentTime = "Please select an appointment time";

  if (isBlank(data?.appointmentType)) {
    errors.appointmentType = "Please select an appointment type";
  } else if (
    data.appointmentType === "in-person" &&
    isBlank(data?.meetingLocation)
  ) {
    errors.meetingLocation = "Meeting location is required for in-person meetings";
  }

  return errors;
}

/** Every rule above, for the final check before submitting. */
export function validateProjectRequest(data: any): ValidationErrors {
  return {
    ...validateClientInfo(data),
    ...validateProjectDetails(data),
    ...validateAppointment(data),
  };
}

export const hasErrors = (errors: ValidationErrors): boolean =>
  Object.keys(errors).length > 0;

export const firstError = (errors: ValidationErrors): string =>
  Object.values(errors)[0] ?? "";
