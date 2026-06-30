interface Props {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function ConsentCheckbox({
  id,
  checked,
  onChange,
  required = false,
  disabled = false,
  children,
  className = "",
}: Props) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2.5 cursor-pointer group ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-gray-300 accent-yellow-400 cursor-pointer"
        />
      </div>
      <span className="text-xs text-gray-700 leading-relaxed">
        {required && <span className="text-red-500 font-bold mr-0.5">*</span>}
        {children}
      </span>
    </label>
  );
}
