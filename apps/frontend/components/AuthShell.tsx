import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

const AuthShell = ({ title, subtitle, error, children }: AuthShellProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
    <Link href="/" className="font-hand text-2xl text-white mb-10">
      sketchydraw
    </Link>
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted mt-1.5 mb-7">{subtitle}</p>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300 mb-5"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {children}
    </div>
  </div>
);

export default AuthShell;
