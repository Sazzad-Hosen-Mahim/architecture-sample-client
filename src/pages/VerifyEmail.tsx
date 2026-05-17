import { useSearchParams, useNavigate } from "react-router-dom";
import { useVerifyEmailMutation } from "@/redux/api/authApi";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [verifyEmail, { isLoading, isSuccess, data }] =
    useVerifyEmailMutation();

  useEffect(() => {
    if (token) {
      verifyEmail({ token });
    }
  }, [token, verifyEmail]);

  if (!token) {
    return <p className="text-center mt-10 text-red-600">Invalid link</p>;
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow text-center">
        {isSuccess ? (
          <>
            <h1 className="text-green-600 text-xl font-semibold">
              Email Verified
            </h1>
            <p className="mt-2">{data?.message}</p>
            <button
              className="mt-4 text-blue-600"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </>
        ) : (
          <h1 className="text-red-600 text-xl">Invalid or expired link</h1>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
