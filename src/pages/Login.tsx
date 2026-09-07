import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  // Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { jwtDecode } from "jwt-decode";
import { useAppDispatch } from "@/hooks/useRedux";
import { toast } from "sonner";
import SyncLoader from "react-spinners/SyncLoader";
import { signIn } from "@/redux/features/auth/authActions";
import { useLoginMutation } from "@/redux/api/authApi";
import { landingPathFor } from "@/utils/dashboardAccess";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";

const loginSchema = z.object({
  // Not `.email()`: this field takes an email *or* a username, which the server
  // matches against both columns. Validating it as an address here rejected
  // every username before the request was even sent.
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupInfoOpen, setSignupInfoOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginUser, { isLoading }] = useLoginMutation();
  const [isSubmitting] = useState(false);

  // Where to land after login — the meeting-join link (and similar) send the
  // user here with ?redirect=<same-origin path> so they resume where they were.
  const redirectParam = searchParams.get("redirect");
  const safeRedirect =
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//")
      ? redirectParam
      : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // const navigate = useNavigate();
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await loginUser(data).unwrap();

      const { accessToken, user } = response.data;

      dispatch(
        signIn({
          user,
          accessToken,
        }),
      );

      // Centred rather than the app-wide top-right: this one lands as the page
      // swaps to a dashboard, where a corner toast is easy to miss.
      toast.success("Login successful!", { position: "top-center" });
      if (safeRedirect) {
        navigate(safeRedirect, { replace: true });
      } else if (user.role === "USER") {
        navigate("/user-dashboard");
      } else {
        // Land on the first section this role actually covers, so a finance or
        // media account doesn't open straight onto a "not part of your
        // dashboard" page. Roles with everything still get Studio first.
        navigate(landingPathFor(user) ?? "/dashboard");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Login failed", {
        position: "top-center",
      });
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
              Email / Username
            </label>
            {/* `text`, not `email` — the browser's own validation on an email
                input blocks a username before the form is ever submitted, and
                it silently trims nothing else useful here. `username` for
                autocomplete is the standard token for a field that takes
                either, so password managers still offer saved logins. */}
            <input
              type="text"
              id="email"
              autoComplete="username"
              placeholder="Enter your email or username"
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
              Forgot password? Click here to reset.
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-black cursor-pointer text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          {/* <a
            href="/dashboard"
            className="text-sm font-medium text-gray-900 mb-3"
          >
            Quick Access (Temporary)
          </a> */}
          <p className="text-sm text-gray-600">
            Why can’t I sign up?{" "}
            <button
              type="button"
              onClick={() => setSignupInfoOpen(true)}
              className="text-gray-900 font-medium hover:text-gray-700 cursor-pointer"
            >
              See Here
            </button>
          </p>
          {/* <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-gray-900 font-medium hover:text-gray-700 cursor-pointer"
            >
              Sign up
            </Link>
          </p> */}
          <div className="mt-2">
            <HeroSocialMedia />
          </div>
        </div>
      </div>

      <Dialog open={signupInfoOpen} onOpenChange={setSignupInfoOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Why can’t I sign up?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              This is a private client portal. Accounts are invitation-only.
            </p>
            <p>
              If you’ve submitted a project inquiry (or one was created for
              you), check your email for a secure link to create your account.
            </p>
            <p>Didn’t receive it? Just reach out and we’ll gladly resend it.</p>
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setSignupInfoOpen(false)}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
