"use client"

import { ReactNode } from "react"

interface StaticFormFieldProps {
  name: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: () => void
  type?: "text" | "email" | "tel" | "password"
  required?: boolean
  error?: string
  touched?: boolean
  placeholder?: string
  rightIcon?: ReactNode
  disabled?: boolean
  autoComplete?: string
  testId?: string
}

/**
 * StaticFormField - Reusable form input with static label ABOVE the input
 *
 * Features:
 * - Static label positioned above input (no floating animation)
 * - Red asterisk (*) for required fields
 * - Terracotta focus ring
 * - Red border + error message for validation errors
 * - Consistent h-11 (44px) height for touch targets
 */
const StaticFormField: React.FC<StaticFormFieldProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
  error,
  touched = false,
  placeholder = "",
  rightIcon,
  disabled = false,
  autoComplete,
  testId,
}) => {
  const hasError = touched && Boolean(error)

  return (
    <div className="w-full">
      {/* Static label above input */}
      <label
        htmlFor={name}
        className={`
          block text-sm font-medium mb-1.5
          ${hasError ? "text-rose-500" : "text-ui-fg-subtle"}
        `}
      >
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Input with optional right icon */}
      <div className="relative">
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`
            block w-full h-11 px-4 py-2
            bg-ui-bg-field border rounded-md appearance-none
            text-ui-fg-base placeholder:text-ui-fg-muted
            focus:outline-none focus:ring-2 focus:ring-tc-terracotta focus:border-tc-terracotta
            hover:bg-ui-bg-field-hover
            transition-colors duration-150
            ${hasError ? "border-rose-500" : "border-ui-border-base"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${rightIcon ? "pr-10" : ""}
          `}
          data-testid={testId}
        />

        {/* Optional right icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-fg-muted pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="mt-1 text-sm text-rose-500">{error}</p>
      )}
    </div>
  )
}

export default StaticFormField
