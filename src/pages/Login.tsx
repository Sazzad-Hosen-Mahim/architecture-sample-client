import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useAppDispatch } from "@/hooks/useRedux";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import SyncLoader from "react-spinners/SyncLoader";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // const navigate = useNavigate();
  const onSubmit = async (data: LoginFormInputs) => {
    console.log("Login Data:", data);
    setIsSubmitting(true);

    try {
      // ✅ Call login mutation
      const response = await loginUser({
        email: data.email,
        password: data.password,
      }).unwrap();

      console.log("Backend Response:", response);

      const accessToken = response?.data?.accessToken;
      if (!accessToken) {
        throw new Error("Login failed! No access token returned.");
      }

      // ✅ Decode JWT
      const decoded: any = jwtDecode(accessToken);
      const user = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        imagUrl: decoded.imagUrl,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      //  Save user & token to Redux
      dispatch(setUser({ user, token: accessToken }));

      //  Show success toast
      toast.success(response?.message || "Login Successful!");

      // Redirect to homepage or dashboard
      navigate("/dashboard"); // change path as needed
    } catch (error: any) {
      // console.error("FULL ERROR:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Login failed! Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 md:px-0">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Login Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">
          Login
        </h1>

        {/* Login Form */}
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
              placeholder="Enter your email"
              {...register("email")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field with Eye Icon */}
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
              placeholder="Enter your password"
              {...register("password")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-black pr-10"
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

          {/* Forgot Password Link */}
          <div className="text-left">
            <a
              href="/forgotPassword"
              className="text-sm text-gray-900 hover:text-blue-700"
            >
              Forgot password
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-black text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || isLoading ? (
              <>
                Logging in <SyncLoader size={8} color="#fff" />
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Quick Access Section */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="text-sm font-medium text-gray-900 mb-3"
          >
            Quick Access (Temporary)
          </a>
          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-gray-900 font-medium hover:text-gray-700 cursor-pointer"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
