import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  as?: "input" | "textarea" | "select";
  options?: { label: string; value: string }[];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      as = "input",
      options = [],
      className = "",
      type = "text",
      ...rest
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-neutral-800 dark:text-neutral-200 font-medium">
            {label}
          </label>
        )}

        {as === "textarea" ? (
          <textarea
            className={`block w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 text-sm focus:ring focus:ring-primary-200 focus:border-primary-400 ${className}`}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : as === "select" ? (
          <select
            className={`block w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 text-sm focus:ring focus:ring-primary-200 focus:border-primary-400 ${className}`}
            {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={ref}
            type={type}
            className={`block w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 text-sm focus:ring focus:ring-primary-200 focus:border-primary-400 ${className}`}
            {...rest}
          />
        )}
      </div>
    );
  }
);

export default Input;
