import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", containerClassName = "", id, ...props }, ref) => (
    <label className={`app-field block ${containerClassName}`.trim()} htmlFor={id}>
      {label ? <span className="app-label">{label}</span> : null}
      <input ref={ref} id={id} className={`app-input ${className}`.trim()} {...props} />
      {error ? <span className="app-field-hint text-rose-300">{error}</span> : hint ? <span className="app-field-hint">{hint}</span> : null}
    </label>
  )
);

Input.displayName = "Input";
