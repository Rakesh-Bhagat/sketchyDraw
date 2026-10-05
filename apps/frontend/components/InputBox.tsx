interface InputBoxProps {
  type: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  label?: string;
  error?: string;
  value?: string;
  autoComplete?: string;
}

const InputBox = ({ type, handleChange, placeholder, label, error, value, autoComplete }: InputBoxProps) => {
  return (
    <label className="block">
      {label && <span className="block text-xs text-muted mb-1.5">{label}</span>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={handleChange}
        aria-invalid={!!error}
        className={`w-full rounded-lg bg-surface border px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-accent ${
          error ? "border-red-500/70" : "border-line"
        }`}
      />
      {error && <span className="block text-xs text-red-400 mt-1.5">{error}</span>}
    </label>
  );
};

export default InputBox;
