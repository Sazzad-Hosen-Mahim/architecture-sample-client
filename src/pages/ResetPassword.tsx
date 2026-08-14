import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useResetPasswordMutation } from "@/redux/api/authApi";

// Validation Schema — mirrors the server's 8-character minimum.
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The emailed link carries `?token=...&email=...`.
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInputs) => {
    if (!token) return;
    try {
      const res = await resetPassword({
        token,
        password: data.password,
      }).unwrap();
      toast.success(res?.message || "Password has been reset successfully.");
      navigate("/login");
    } catch (error: any) {
      toast.error(
        error?.data?.message || "This reset link is invalid or has expired."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Page Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">
          Reset Password
        </h1>
        {email && (
          <p className="text-center text-sm text-gray-500 mb-6 break-all">
            for {email}
          </p>
        )}

        {!token ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Missing reset token</p>
              <p className="mt-1">
                Open this page from the link in your password reset email, or{" "}
                <Link
                  to="/forgotPassword"
                  className="underline font-medium hover:text-amber-900"
                >
                  request a new link
                </Link>
                .
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={`space-y-6 ${email ? "" : "mt-6"}`}
          >
            {/* New Password Field */}
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter new password"
                {...register("password")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

            {/* Confirm Password Field */}
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
                placeholder="Confirm new password"
                {...register("confirmPassword")}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

            {/* Reset Password Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black cursor-pointer text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none disabled:opacity-60 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Back to{" "}
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

export default ResetPassword;
