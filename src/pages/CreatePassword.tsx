import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useResetPasswordMutation } from "@/redux/api/authApi";

/**
 * Where a new staff member lands from the "Create Your Password" button in
 * their welcome email.
 *
 * It posts to the same endpoint the reset flow uses, because activating an
 * account and resetting a password are the same operation on the server: set
 * the password, mark the address verified, burn the token. Only the wording
 * differs — someone who has never had a password is not "resetting" one, and a
 * page that says so reads as though they have the wrong link.
 */
const createPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password needs at least 1 capital letter")
      .regex(/[0-9]/, "Password needs at least 1 number"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type CreatePasswordInputs = z.infer<typeof createPasswordSchema>;

const CreatePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The welcome email links here with `?token=...&email=...`.
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [createPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePasswordInputs>({
    resolver: zodResolver(createPasswordSchema),
  });

  const onSubmit = async (data: CreatePasswordInputs) => {
    if (!token) return;
    try {
      await createPassword({ token, password: data.password }).unwrap();
      toast.success("Your account is ready. Please sign in.");
      navigate("/login");
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          "This setup link is invalid or has expired. Ask your administrator to send a new one.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">
          Create Your Password
        </h1>
        <p className="text-center text-sm text-gray-500 mb-1">
          Set a password to activate your account
        </p>
        {email && (
          <p className="text-center text-sm text-gray-500 mb-6 break-all">
            for {email}
          </p>
        )}

        {!token ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Missing setup link</p>
              <p className="mt-1">
                Open this page using the "Create Your Password" button in your
                welcome email. If the link has expired, ask your administrator
                to send a new one.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={`space-y-6 ${email ? "" : "mt-6"}`}
          >
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create a password"
                autoComplete="new-password"
                {...register("password")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black"
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
              {errors.password ? (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters, with 1 capital letter and 1 number.
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirm Password
              </label>
              <input
                type={showConfirm ? "text" : "password"}
                id="confirmPassword"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showConfirm ? (
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black cursor-pointer text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none disabled:opacity-60 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Password"
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already set up?{" "}
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

export default CreatePassword;
