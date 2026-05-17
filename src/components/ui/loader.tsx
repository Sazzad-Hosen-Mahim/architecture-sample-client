import SyncLoader from "react-spinners/SyncLoader";

interface LoaderProps {
  className?: string;
  size?: number;
  color?: string;
  fullScreen?: boolean;
}

export function Loader({
  className = "",
  size = 12,
  color = "#000000",
  fullScreen = true,
}: LoaderProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen" : "w-full py-12"
      } ${className}`}
    >
      <SyncLoader size={size} color={color} />
    </div>
  );
}
