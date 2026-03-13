"use client";
import InputBox from "@/components/InputBox";
import InputButton from "@/components/InputButton";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Signup = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_HTTP_URL;
      const response = await axios.post(
        `${serverUrl}/signin`,
        { username, password },
        { withCredentials: true }
      );
      const token = response.data.token;
      localStorage.setItem("token", token);
      router.push("/canvas");
    } catch (error) {
      console.log("signin failed: " + error);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-neutral-300 p-4">
      <div className="w-full max-w-5xl h-full max-h-[90vh] bg-[hsl(var(--auth-background))] rounded-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="relative hidden md:block">
          <Image
            src={"/signup.jpg"}
            alt="signup-image"
            fill
            className="object-cover"
          />
        </div>
        <div className="px-6 md:px-12 py-10 md:py-20 flex flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl md:text-4xl mb-2 text-white font-semibold">Log In</h2>
            <p className="text-sm text-gray-300">
              Don&apos;t have an account?{" "}
              <Link href={"/signup"} className="underline">
                Sign up
              </Link>
            </p>
          </div>
          <div className="flex flex-col mt-10 space-y-4">
            <InputBox
              type="text"
              placeholder="Username"
              handleChange={(e) => setUsername(e.target.value)}
            />
            <InputBox
              type="password"
              placeholder="Enter Your Password"
              handleChange={(e) => setPassword(e.target.value)}
            />
            <InputButton buttonText="Log In" onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
