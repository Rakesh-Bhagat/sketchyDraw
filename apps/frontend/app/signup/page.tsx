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
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_HTTP_URL;
      const response = await axios.post(
        `${serverUrl}/signup`,
        {
          name,
          username,
          password,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data) {
        router.push("/signin");
      }
    } catch (error) {
      console.log("signup failure: " + error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-300 px-4">
      <div className="w-full max-w-5xl bg-[hsl(var(--auth-background))] rounded-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-lg">

        {/* Image Section */}
        <div className="hidden md:block relative">
          <Image
            src="/signup.jpg"
            alt="signup-image"
            fill
            className="object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="px-6 sm:px-10 md:px-12 py-10 sm:py-14 flex flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl mb-2 text-white font-semibold">
              Create an Account
            </h2>

            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="underline text-white">
                Log in
              </Link>
            </p>
          </div>

          <div className="flex flex-col mt-10 sm:mt-14 gap-4">
            <InputBox
              type="text"
              placeholder="Name"
              handleChange={(e) => setName(e.target.value)}
            />

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

            <InputButton
              buttonText="Create Account"
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;