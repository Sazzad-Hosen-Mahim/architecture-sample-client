// import React from "react";

// function ForgotPassword() {
//   return <div>ForgotPassword</div>;
// }

// export default ForgotPassword;

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInputs) => {
    console.log("Forgot Password Email:", data);
    toast.success("Password reset link sent to your email (demo)");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Page Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">
          Forgot Password
        </h1>

        {/* Forgot Password Form */}
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
            className="w-full bg-black cursor-pointer text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none "
          >
            Reset Password
          </button>
        </form>

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
      </div>
    </div>
  );
};

export default ForgotPassword;
