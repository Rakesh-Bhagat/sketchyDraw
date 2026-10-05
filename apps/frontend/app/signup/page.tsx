"use client";
import AuthShell from "@/components/AuthShell";
import InputBox from "@/components/InputBox";
import InputButton from "@/components/InputButton";
import { parseAuthError } from "@/utils/authError";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Signup = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (name.trim().length < 3) local.name = "Name must be at least 3 characters";
    if (username.trim().length < 4 || username.trim().length > 30)
      local.username = "Username must be 4-30 characters";
    if (password.length < 6) local.password = "Password must be at least 6 characters";
    setFields(local);
    setError("");
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_HTTP_URL;
      await axios.post(
        `${serverUrl}/signup`,
        { name: name.trim(), username: username.trim(), password },
        { withCredentials: true }
      );
      router.push("/signin");
    } catch (err) {
      const parsed = parseAuthError(err, "signup");
      setError(parsed.message);
      setFields(parsed.fields);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have one?{" "}
          <Link href="/signin" className="text-white underline underline-offset-4">
            Log in
          </Link>
        </>
      }
      error={error}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputBox
          label="Name"
          type="text"
          placeholder="Ada Lovelace"
          autoComplete="name"
          value={name}
          error={fields.name}
          handleChange={(e) => setName(e.target.value)}
        />
        <InputBox
          label="Username"
          type="text"
          placeholder="ada"
          autoComplete="username"
          value={username}
          error={fields.username}
          handleChange={(e) => setUsername(e.target.value)}
        />
        <InputBox
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={password}
          error={fields.password}
          handleChange={(e) => setPassword(e.target.value)}
        />
        <div className="pt-2">
          <InputButton buttonText="Create account" loading={loading} />
        </div>
      </form>
    </AuthShell>
  );
};

export default Signup;
