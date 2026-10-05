interface InputButtonProps {
  buttonText: string;
  loading?: boolean;
}

const InputButton = ({ buttonText, loading }: InputButtonProps) => {
  return (
    <button
      type="submit"
      disabled={loading}
      className="cursor-pointer w-full rounded-lg bg-white text-black text-sm font-medium py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Please wait…" : buttonText}
    </button>
  );
};

export default InputButton;
