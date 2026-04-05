import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Textarea = ({ label, hint, error, className = "", containerClassName = "", id, rows = 4, ...props }: TextareaProps) => (
  <label className={`app-field block ${containerClassName}`.trim()} htmlFor={id}>
    {label ? <span className="app-label">{label}</span> : null}
    <textarea id={id} rows={rows} className={`app-input resize-y ${className}`.trim()} {...props} />
    {error ? <span className="app-field-hint text-rose-300">{error}</span> : hint ? <span className="app-field-hint">{hint}</span> : null}
  </label>
);
