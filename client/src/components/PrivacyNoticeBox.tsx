import { useState } from "react";
import { Shield, X, Info } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
  dismissible?: boolean;
  variant?: "yellow" | "info" | "warning" | "green";
  compact?: boolean;
}

const VARIANTS = {
  yellow: {
    wrap: "bg-yellow-50 border-yellow-200",
    icon: "bg-yellow-400",
    iconColor: "text-black",
    title: "text-yellow-900",
    text: "text-yellow-800",
  },
  info: {
    wrap: "bg-blue-50 border-blue-200",
    icon: "bg-blue-500",
    iconColor: "text-white",
    title: "text-blue-900",
    text: "text-blue-800",
  },
  warning: {
    wrap: "bg-orange-50 border-orange-200",
    icon: "bg-orange-400",
    iconColor: "text-white",
    title: "text-orange-900",
    text: "text-orange-800",
  },
  green: {
    wrap: "bg-green-50 border-green-200",
    icon: "bg-green-500",
    iconColor: "text-white",
    title: "text-green-900",
    text: "text-green-800",
  },
};

export default function PrivacyNoticeBox({
  title,
  children,
  dismissible = false,
  variant = "yellow",
  compact = false,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const v = VARIANTS[variant];

  return (
    <div className={`rounded-xl border p-4 ${v.wrap}`} style={{ fontFamily: "Inter, sans-serif" }}>
      <div className={`flex items-start gap-3 ${compact ? "gap-2" : "gap-3"}`}>
        <div
          className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full ${v.icon} flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          <Shield className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${v.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${compact ? "text-xs" : "text-sm"} font-bold ${v.title} mb-1`}>{title}</p>
          <div className={`${compact ? "text-xs" : "text-xs"} ${v.text} leading-relaxed`}>{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className={`${v.title} opacity-50 hover:opacity-80 flex-shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
