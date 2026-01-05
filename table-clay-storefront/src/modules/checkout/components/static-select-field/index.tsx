"use client"

interface SelectOption {
  value: string
  label: string
}

interface StaticSelectFieldProps {
  name: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onBlur?: () => void
  options: SelectOption[]
  required?: boolean
  error?: string
  touched?: boolean
  placeholder?: string
  disabled?: boolean
  testId?: string
}

/**
 * StaticSelectField - Reusable select/dropdown with static label ABOVE the select
 *
 * Features:
 * - Static label positioned above select (no floating animation)
 * - Red asterisk (*) for required fields
 * - Custom dropdown arrow icon
 * - Terracotta focus ring
 * - Red border + error message for validation errors
 * - Placeholder styling when no value selected
 * - Consistent h-11 (44px) height for touch targets
 */
const StaticSelectField: React.FC<StaticSelectFieldProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  required = false,
  error,
  touched = false,
  placeholder = "Select...",
  disabled = false,
  testId,
}) => {
  const hasError = touched && Boolean(error)
  const hasValue = Boolean(value)

  return (
    <div className="w-full">
      {/* Static label above select */}
      <label
        htmlFor={name}
        className={`
          block text-sm font-medium mb-1.5
          ${hasError ? "text-rose-500" : "text-gray-700"}
        `}
      >
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Select with custom arrow */}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            block w-full h-11 px-4 py-2
            bg-ui-bg-field border rounded-md appearance-none
            text-ui-fg-base cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-tc-terracotta focus:border-tc-terracotta
            hover:bg-ui-bg-field-hover
            transition-colors duration-150
            ${hasError ? "border-rose-500" : "border-ui-border-base"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${!hasValue ? "text-gray-400" : ""}
          `}
          data-testid={testId}
        >
          {/* Placeholder option */}
          <option value="" disabled={required}>
            {placeholder}
          </option>

          {/* Options */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-ui-fg-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <p className="mt-1 text-sm text-rose-500">{error}</p>
      )}
    </div>
  )
}

export default StaticSelectField
