"use client";
import AuthShell from "@/components/AuthShell";
import InputBox from "@/components/InputBox";
import InputButton from "@/components/InputButton";
import { parseAuthError } from "@/utils/authError";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Signin = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!username.trim()) local.username = "Enter your username";
    else if (username.trim().length < 4) local.username = "Username must be at least 4 characters";
    if (!password) local.password = "Enter your password";
    setFields(local);
    setError("");
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_HTTP_URL;
      const response = await axios.post(
        `${serverUrl}/signin`,
        { username: username.trim(), password },
        { withCredentials: true }
      );
      // The server can reply 200 with an error message and no token.
      if (!response.data?.token) {
        setError("Please check your username and password.");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", response.data.token);
      router.push("/canvas");
    } catch (err) {
      const parsed = parseAuthError(err, "signin");
      setError(parsed.message);
      setFields(parsed.fields);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here?{" "}
          <Link href="/signup" className="text-white underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
      error={error}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputBox
          label="Username"
          type="text"
          placeholder="yourname"
          autoComplete="username"
          value={username}
          error={fields.username}
          handleChange={(e) => setUsername(e.target.value)}
        />
        <InputBox
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          error={fields.password}
          handleChange={(e) => setPassword(e.target.value)}
        />
        <div className="pt-2">
          <InputButton buttonText="Log in" loading={loading} />
        </div>
      </form>
    </AuthShell>
  );
};

export default Signin;
