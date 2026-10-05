"use client";
import Navbar from "@/components/Navbar";
import { ArrowRight, Infinity as InfinityIcon, Pencil, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const features = [
  { icon: Pencil, title: "Hand-drawn feel", text: "Sketchy shapes that keep ideas loose and unprecious." },
  { icon: Users, title: "Live together", text: "See cursors and edits from your team as they happen." },
  { icon: Zap, title: "Instant rooms", text: "Create a room, share the code, start drawing." },
  { icon: InfinityIcon, title: "Infinite canvas", text: "Room to branch, explore and keep going." },
];

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) router.push(`/room/${roomCode.trim()}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5">
        <section className="pt-24 sm:pt-32 pb-20 text-center">
          <h1 className="font-hand text-5xl sm:text-7xl text-white leading-tight">
            Sketch ideas, together.
          </h1>
          <p className="text-muted max-w-md mx-auto mt-5 text-base sm:text-lg">
            A quiet, realtime whiteboard for brainstorming and wireframing with your team.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              Create a room <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/canvas"
              className="inline-flex items-center justify-center rounded-lg border border-line text-sm px-5 py-2.5 text-white hover:bg-surface transition-colors"
            >
              Try the canvas
            </Link>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2 max-w-xs mx-auto mt-10">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Have a room code?"
              className="flex-1 min-w-0 rounded-lg bg-surface border border-line px-3.5 py-2 text-sm placeholder:text-neutral-600 outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-lg border border-line px-4 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              Join
            </button>
          </form>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden mb-24">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-bg p-6">
              <Icon className="w-5 h-5 text-accent mb-4" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-white mb-1.5">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between text-xs text-muted">
          <span className="font-hand text-base text-white">sketchydraw</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
