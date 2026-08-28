import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
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
    password: z.string().min(8, "Password must be at least 8 characters"),
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
  });

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
      };

      const res = await registerUser(payload).unwrap();

      toast.success(res?.message || "Registration successful!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">
          Create Account
        </h1>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          {/* Company Name (optional) */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-900 mb-2"
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

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-900 mb-2"
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
              {...register("email")}
              className={inputClass}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                {...register("password")}
                className={inputClass}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className={inputClass}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Optional address details */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-md font-light text-gray-900 mt-4 mb-2">
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
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-gray-900 font-medium hover:text-gray-700"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
