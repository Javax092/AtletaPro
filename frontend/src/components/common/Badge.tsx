import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClassName: Record<BadgeTone, string> = {
  neutral: "app-badge-neutral",
  success: "app-badge-success",
  warning: "app-badge-warning",
  danger: "app-badge-danger",
  info: "app-badge-info",
};

export const Badge = ({ tone = "neutral", className = "", ...props }: BadgeProps) => (
  <span className={`app-badge ${toneClassName[tone]} ${className}`.trim()} {...props} />
);
