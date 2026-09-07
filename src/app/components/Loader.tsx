import { Loader2 } from "lucide-react";

interface LoaderProps {
  label?: string;
  size?: number;
  fullHeight?: boolean;
  className?: string;
}

/** Shared spinner for API request/response and Suspense loading states. */
export function Loader({
  label,
  size = 24,
  fullHeight = true,
  className = "",
}: Readonly<LoaderProps>) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${fullHeight ? "h-full" : ""} ${className}`}
    >
      <Loader2 size={size} className="animate-spin" style={{ color: "#1565C0" }} />
      {label && (
        <p className="text-sm" style={{ color: "#64748b" }}>
          {label}
        </p>
      )}
    </div>
  );
}
