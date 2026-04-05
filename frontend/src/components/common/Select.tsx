import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  children: ReactNode;
};

export const Select = ({ label, hint, error, className = "", containerClassName = "", id, children, ...props }: SelectProps) => (
  <label className={`app-field block ${containerClassName}`.trim()} htmlFor={id}>
    {label ? <span className="app-label">{label}</span> : null}
    <select id={id} className={`app-input ${className}`.trim()} {...props}>
      {children}
    </select>
    {error ? <span className="app-field-hint text-rose-300">{error}</span> : hint ? <span className="app-field-hint">{hint}</span> : null}
  </label>
);
