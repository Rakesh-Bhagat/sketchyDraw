"use client";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DecodedToken {
  name: string;
  userId: string;
}

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        setUser(jwtDecode<DecodedToken>(token).name);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <nav className="border-b border-line">
      <div className="max-w-5xl mx-auto px-5 h-14 flex justify-between items-center">
        <Link href="/" className="font-hand text-2xl text-white">
          sketchydraw
        </Link>
        <div className="flex items-center gap-2 sm:gap-5 text-sm">
          <Link href="/dashboard" className="hidden sm:block text-muted hover:text-white transition-colors">
            Rooms
          </Link>
          {user ? (
            <>
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-medium flex items-center justify-center uppercase">
                {user.charAt(0)}
              </span>
              <button onClick={handleLogout} className="cursor-pointer text-muted hover:text-white transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/signin")}
                className="cursor-pointer text-muted hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="cursor-pointer rounded-lg bg-white text-black px-3.5 py-1.5 font-medium hover:opacity-90 transition-opacity"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
