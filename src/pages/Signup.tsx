import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useRegisterMutation,
  useGetClaimInfoQuery,
  useResendClaimMutation,
} from "@/redux/api/authApi";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import LegalDocumentModal, {
  type LegalDocument,
} from "@/components/Common/LegalDocumentModal";
import {
  CountrySelect,
  StateSelect,
} from "@/components/Common/LocationSelects";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    companyName: z.string().optional(),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email format"),
    // Matches the note shown under the fields — a stated requirement the form
    // did not actually check would just be a promise to the client that the
    // next screen breaks.
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password needs at least 1 capital letter")
      .regex(/[0-9]/, "Password needs at least 1 number"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    // Optional address details
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    streetAddress: z.string().optional(),
    zipCode: z.string().optional(),
    aptSuiteUnit: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

type SignUpFormInputs = z.infer<typeof signUpSchema>;

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimToken = searchParams.get("claim") || "";

  // When the page is opened from an "Inquiry Accepted" email, prefill what we
  // already know and lock the email to the address the invite went to.
  const { data: claimResp, isLoading: isLoadingClaim } = useGetClaimInfoQuery(
    claimToken,
    { skip: !claimToken },
  );
  const claim = claimResp?.data;
  const isValidClaim = Boolean(claimToken && claim?.valid);
  const isExpiredClaim = Boolean(claimToken && claim && !claim.valid);

  const [resendClaim, { isLoading: isResending }] = useResendClaimMutation();
  const [resendEmail, setResendEmail] = useState("");
  // Reachable without a token at all: someone who has *lost* the email has no
  // link to open, so the expired screen was unreachable for exactly the people
  // who needed it most.
  const [showResendPanel, setShowResendPanel] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
  });

  // Seed the resend box with the address the invite went to, so an expired
  // link needs one click rather than retyping an email from memory.
  useEffect(() => {
    const known = claim?.email;
    if (known) setResendEmail((prev) => prev || known);
  }, [claim?.email]);

  useEffect(() => {
    if (!claim?.valid) return;
    // Prefill everything we already captured from the inquiry; the visitor
    // just picks a username and password.
    reset({
      firstName: claim.firstName || "",
      lastName: claim.lastName || "",
      companyName: claim.companyName || "",
      username: "",
      email: claim.email || "",
      password: "",
      confirmPassword: "",
      country: claim.country || "",
      state: claim.state || "",
      city: claim.city || "",
      streetAddress: claim.streetAddress || "",
      zipCode: claim.zipCode || "",
      aptSuiteUnit: claim.aptSuiteUnit || "",
    });
  }, [claim, reset]);

  const [registerUser, { isLoading }] = useRegisterMutation();

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      // Only send optional fields when the user actually filled them in.
      const optional = (value?: string) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : undefined;
      };

      const payload = {
        name: data.username.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        companyName: optional(data.companyName),
        country: optional(data.country),
        state: optional(data.state),
        city: optional(data.city),
        streetAddress: optional(data.streetAddress),
        zipCode: optional(data.zipCode),
        aptSuiteUnit: optional(data.aptSuiteUnit),
        claimToken: claimToken || undefined,
      };

      const res = await registerUser(payload).unwrap();

      toast.success(res?.message || "Registration successful!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.data?.message || "Registration failed");
    }
  };

  const handleResend = async () => {
    const email = resendEmail.trim() || claim?.email || "";
    if (!email) {
      toast.error("Enter the email your inquiry was submitted with.");
      return;
    }
    try {
      const res = await resendClaim({ email }).unwrap();
      const message =
        res?.message || "If an accepted inquiry exists, a new link was sent.";

      // The three outcomes read differently on purpose. Previously every one
      // of them — including "found nothing" and "the mail failed" — showed the
      // same success toast, which is why this looked like it did nothing.
      if (res?.status === "ALREADY_REGISTERED") {
        toast.info(message, { duration: 9000 });
      } else if (res?.status === "NOT_FOUND") {
        toast.warning(message, { duration: 9000 });
      } else {
        toast.success(message, { duration: 8000 });
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not send a new link.");
    }
  };

  if (claimToken && isLoadingClaim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isExpiredClaim || showResendPanel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {isExpiredClaim
              ? "This signup link has expired"
              : "Get a new signup link"}
          </h1>
          <p className="text-sm text-gray-600">
            Enter the email address you used for your inquiry and we'll send a
            fresh link.
          </p>
          {/* The known address goes in as the *value*, not just the
              placeholder: a placeholder looks filled in but submits nothing,
              so pressing the button did nothing but raise "enter an email". */}
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full bg-black text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-60 cursor-pointer"
          >
            {isResending ? "Sending..." : "Send me a new link"}
          </button>
          {/* A route, not a mailto: — a mailto does nothing at all on a machine
              with no mail client configured, which is why this read as a dead
              button. The contact page works everywhere. */}
          <p className="text-sm text-center text-gray-600">
            Questions?{" "}
            <Link
              to="/contact"
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-700"
            >
              Contact us
            </Link>
          </p>

          {showResendPanel && !isExpiredClaim && (
            <button
              type="button"
              onClick={() => setShowResendPanel(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              Back to sign up
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    // Sized to fit a 100% zoom viewport without scrolling: the outer padding,
    // the card padding, the heading margin and the banner have each been pulled
    // in a step, which together buy back roughly the height the page was
    // overflowing by. `items-start` rather than `items-center` so a short
    // viewport scrolls from the top of the card instead of clipping it.
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-4 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-3">
          Create Account
        </h1>

        {isValidClaim && (
          <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Your inquiry
            {claim?.projectName ? (
              <>
                {" "}
                for <span className="font-semibold">{claim.projectName}</span>
              </>
            ) : null}{" "}
            has been accepted. Finish creating your account below — you'll be
            added to our client list right away.
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* First / Last name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="Enter your first name"
                {...register("firstName")}
                className={inputClass}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                placeholder="Enter your last name"
                {...register("lastName")}
                className={inputClass}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Company Name + Username share a row, the same as the name pair
              above — two short fields on their own lines were a good part of
              why this form needed scrolling. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Company Name (optional)
              </label>
              <input
                type="text"
                id="companyName"
                placeholder="Enter your company name"
                {...register("companyName")}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                {...register("username")}
                className={inputClass}
              />
              {errors.username && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              readOnly={isValidClaim}
              {...register("email")}
              className={`${inputClass} ${isValidClaim ? "bg-gray-100 text-gray-500" : ""}`}
            />
            {isValidClaim && (
              <p className="text-xs text-gray-500 mt-1">
                This is the address your invitation was sent to.
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                {...register("password")}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Spans both columns so it reads as a note on the pair, not on the
                confirm field. `text-xs` matches the email note above it. */}
            <p className="text-xs text-red-600 sm:col-span-2 -mt-2">
              Password Requires:
              <br />
              Minimum 8 Characters, 1 Capital Letter Minimum, 1 Number Minimum
            </p>
          </div>

          {/* Optional address details */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-md font-light text-gray-900 mt-2 mb-2">
              Address (Optional)
            </p>
            {/* <p className="text-xs text-gray-500 mb-4">
              Optional — you can add this later from Profile Settings.
            </p> */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div>
                <label
                  htmlFor="streetAddress"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  placeholder="Street address"
                  {...register("streetAddress")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  APT / Suite
                </label>
                <input
                  type="text"
                  id="aptSuiteUnit"
                  placeholder="Enter apartment or suite number"
                  {...register("aptSuiteUnit")}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Country
                  </label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <CountrySelect
                        id="country"
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Select country"
                      />
                    )}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    State
                  </label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <StateSelect
                        id="state"
                        country={watch("country")}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Select a state"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    placeholder="City"
                    {...register("city")}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    placeholder="Zip code"
                    {...register("zipCode")}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>

          {/* Opened in a modal rather than navigated to: someone part-way
              through this form must not lose what they've typed to go and read
              the terms. */}
          <p className="text-xs text-center text-gray-500 mt-3">
            By creating an account, you agree to the{" "}
            <button
              type="button"
              onClick={() => setLegalDocument("terms")}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Terms of Service
            </button>{" "}
            and our{" "}
            <button
              type="button"
              onClick={() => setLegalDocument("privacy")}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Privacy Policy
            </button>
            .
          </p>

          {/* For someone whose inquiry was accepted but who no longer has the
              email. Without this the resend screen could only be reached by
              opening a link they had already lost. */}
          <p className="text-xs text-center text-gray-500 mt-2">
            Lost the signup link from your inquiry?{" "}
            <button
              type="button"
              onClick={() => setShowResendPanel(true)}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Send it again
            </button>
          </p>
        </form>

        {legalDocument && (
          <LegalDocumentModal
            document={legalDocument}
            onClose={() => setLegalDocument(null)}
          />
        )}
        {/* No "Already have an account?" link here — this card is reached from
            an invitation, so the reader is by definition signing up. The empty
            footer that held it was still contributing its `mt-8`. */}
      </div>
    </div>
  );
};

export default SignUp;
