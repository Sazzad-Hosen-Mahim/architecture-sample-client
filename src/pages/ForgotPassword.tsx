import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

// Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInputs) => {
    const email = data.email.trim();
    try {
      const res = await forgotPassword({ email }).unwrap();
      toast.success(res?.message || "Password reset link sent.");
      setSentTo(email);
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          "Could not send the reset link. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-[calc(100dvh-57px)] bg-gray-50 flex items-center justify-center px-4 md:px-0 py-8">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Page Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">
          Forgot Password
        </h1>

        {sentTo ? (
          // The API answers identically for known and unknown addresses, so the
          // confirmation is deliberately non-committal about whether an account
          // exists.
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <MailCheck className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">
              If an account exists for{" "}
              <span className="font-medium text-gray-900">{sentTo}</span>, a
              password reset link is on its way.
            </p>
            <p className="text-xs text-gray-500">
              The link expires in 1 hour. Check your spam folder if it doesn't
              arrive.
            </p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="text-sm text-gray-900 font-medium hover:text-gray-700 cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your registered email"
                {...register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
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
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="text-gray-900 font-medium hover:text-gray-700"
            >
              Back to Login
            </Link>
          </p>
        </div>
        <div>
          <HeroSocialMedia />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
