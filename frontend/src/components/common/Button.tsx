import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "app-button-primary",
  secondary: "app-button-secondary",
  danger: "app-button-danger",
  ghost: "app-button-ghost",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  leadingIcon,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`${variantClassName[variant]} ${sizeClassName[size]} inline-flex min-h-[2.75rem] items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    {...props}
  >
    {leadingIcon ? <span className="text-[0.95em] opacity-85">{leadingIcon}</span> : null}
    {children}
  </button>
);
