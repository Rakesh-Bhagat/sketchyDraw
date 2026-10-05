"use client";
import LoginButton from "@/components/LoginButton";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, Calendar, Copy, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Room {
  id: string;
  name: string;
  creatorId: string;
  createdAt: Date;
}
interface RawRoom {
  id: string;
  name: string;
  creatorId: string;
  createdAt: Date;
}
interface DecodedToken {
  name: string;
  userId: string;

}
const Dashboard = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const serverUrl = process.env.NEXT_PUBLIC_HTTP_URL

  useEffect(() => {
    async function getRooms() {
      try {
        const response = await axios.get(`${serverUrl}/rooms`, {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        });
        if (!response) return;
        setRooms(
          response.data.map((room : RawRoom) => ({
            ...room,
            createdAt: new Date(room.createdAt),
          }))
        );
      } catch (error) {
        console.log(error);
      } finally {
        setRoomsLoading(false);
      }
    }
    getRooms();
  }, [serverUrl]);
  const handleDelete = async (roomId: string) => {
    try {
      await axios.delete(`${serverUrl}/room`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
        data: { roomId },
      });

      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Failed to delete room:", error);
    }
  };

  const handleRoomCreate = async () => {
    if (!roomName.trim()) return;
    console.log(roomName);
    try {
      const response = await axios.post(
        `${serverUrl}/room`,
        {
          name: roomName,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response);
      if (response.data) {
        setRooms((prev) => [
          ...prev,
          { ...response.data, createdAt: new Date(response.data.createdAt) },
        ]);
        setIsOpen(false);
        setRoomName("");
        return;
      }
      return;
    } catch (error) {
      console.log(error);
    }
  };
  const handleCodeCopy = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
    router.push("/signin");
    return;
  }
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUser(decoded.name);
        setLoading(false)
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push('/')
  };
  if (loading) return <div className="p-6 text-sm text-muted">Loading…</div>;
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-hand text-2xl text-white">sketchydraw</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-medium flex items-center justify-center uppercase">
                {user.charAt(0)}
              </span>
              <button onClick={handleLogout} className="cursor-pointer text-muted hover:text-white transition-colors">
                Log out
              </button>
            </div>
          ) : (
            <LoginButton onclick={() => router.push("/signin")} text="Log in" />
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your rooms</h1>
            <p className="text-sm text-muted mt-1">Shared canvases you&apos;ve created</p>
          </div>
          <button
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white text-black text-sm font-medium px-3.5 py-2 hover:opacity-90 transition-opacity"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New room
          </button>
        </div>

        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-xl bg-surface border border-line p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-semibold">New room</h2>
                <button className="cursor-pointer text-muted hover:text-white" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted mb-5">Give your canvas a name.</p>
              <input
                type="text"
                autoFocus
                className="w-full rounded-lg bg-bg border border-line px-3.5 py-2.5 text-sm placeholder:text-neutral-600 outline-none focus:border-accent transition-colors mb-5"
                placeholder="e.g. Design review"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRoomCreate()}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="cursor-pointer rounded-lg px-4 py-2 text-sm text-muted hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="cursor-pointer rounded-lg bg-white text-black text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
                  onClick={handleRoomCreate}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {roomsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Loading rooms">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-surface border border-line p-5 h-36" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-line rounded-xl">
            <h3 className="text-white font-medium mb-1">No rooms yet</h3>
            <p className="text-sm text-muted mb-5">Create your first room to start collaborating.</p>
            <button
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white text-black text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create room
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-xl bg-surface border border-line p-5 flex flex-col">
                <h3 className="font-medium text-white truncate">{room.name}</h3>
                <button
                  className="cursor-pointer mt-1 flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors self-start max-w-full"
                  onClick={() => handleCodeCopy(room.id)}
                  title="Copy room code"
                >
                  <Copy className="w-3 h-3 shrink-0" />
                  <span className="truncate font-mono">{room.id}</span>
                </button>
                <p className="flex items-center gap-1.5 text-xs text-muted mt-3 mb-5">
                  <Calendar className="w-3 h-3" />
                  {room.createdAt.toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-auto">
                  <button
                    className="cursor-pointer flex-1 rounded-lg border border-line py-2 text-sm text-white hover:bg-bg transition-colors"
                    onClick={() => router.push(`/room/${room.id}`)}
                  >
                    Open
                  </button>
                  <button
                    className="cursor-pointer rounded-lg border border-line px-3 text-muted hover:text-red-400 hover:border-red-500/40 transition-colors"
                    onClick={() => handleDelete(room.id)}
                    aria-label="Delete room"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
