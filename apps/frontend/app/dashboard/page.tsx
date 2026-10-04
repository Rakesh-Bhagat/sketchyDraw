"use client";
import LoginButton from "@/components/LoginButton";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, Calendar, Copy, Edit3, Plus, Trash, X } from "lucide-react";
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
  if (loading) return <div className="text-white p-4">Loading...</div>;
  return (
    <div className="min-h-screen bg-gray-900 font-mono">
      {/* Header */}
      <header className="border-b-2 border-dashed border-gray-600 bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={"/"}>
              <button className="flex items-center px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            </Link>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
            </div>
          </div>
          <div>
            {user ? (
              <div className="flex ">
                <div className="mr-2 bg-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center uppercase">
                  {user.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white border border-gray-500 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <LoginButton
                onclick={() => router.push("/signin")}
                text="Login"
              />
            )}
          </div>
        </div>
      </header>
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 md:px-8">
        <div className="flex justify-between">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-100 mb-2">
              Your Rooms
            </h2>
            <p className="text-gray-400">
              Manage your collaborative canvas rooms
            </p>
          </div>
          <div>
            <button
              className=" cursor-pointer px-3 py-2 flex items-center justify-center bg-green-600 rounded-lg text-white"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Room
            </button>
            {isOpen && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
                {/* Dialog Box */}
                <div className="bg-gray-800 p-6 sm:p-4 rounded-lg shadow-md w-full max-w-lg z-50 text-white font-mono border-2 border-dashed border-gray-600">
                  <div className=" flex items-center justify-end">
                    <button
                      className="cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold mb-2">Create a New Room</h2>

                  <p className="text-gray-400 mb-4">
                    Give your collaborative canvas a name and start sketching!
                  </p>
                  <p className="mb-1">Room Name</p>
                  <input
                    type="text"
                    className="h-10 w-full rounded-lg border-2 border-dashed border-gray-500 bg-gray-700 text-white px-3 py-2 mb-4"
                    placeholder="e.g., Design Meeting, Brainstorm Session..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />

                  <div className="flex justify-between gap-2">
                    <button
                      className="px-3 py-2 bg-green-600 rounded-md hover:bg-green-400 cursor-pointer w-full sm:w-auto"
                      onClick={handleRoomCreate}
                    >
                      Create Room
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {roomsLoading ? (
          <div
            className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 sm:gap-3"
            role="status"
            aria-label="Loading rooms"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-gray-800 border-2 border-dashed w-full border-gray-600 p-5 min-w-xs"
              >
                <div className="h-6 w-2/3 rounded bg-gray-700 mb-4" />
                <div className="h-4 w-full rounded bg-gray-700 mb-3" />
                <div className="h-4 w-1/2 rounded bg-gray-700 mb-6" />
                <div className="h-10 w-full rounded-md bg-gray-700" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No rooms yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first room to start collaborating!
            </p>
            <button
              className="flex items-center px-5 py-3 rounded-lg mx-auto bg-blue-500 hover:bg-blue-600 text-white border-2 border-dashed border-blue-600"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Room
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 sm:gap-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className=" rounded-lg bg-gray-800 border-2 border-dashed w-full border-gray-500 items-center text-white p-5 min-w-xs "
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Edit3 className="w-4 h-4 mr-2 text-blue-400" />
                    <h3 className="text-xl sm:text-md font-bold text-gray-100">
                      {room.name}
                    </h3>
                  </div>
                  <div>
                    <button
                      className="cursor-pointer"
                      onClick={() => handleCodeCopy(room.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h2 className="text-gray-400 text-md mb-4">Code: {room.id}</h2>
                <div className="mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <h3 className="text-gray-400 text-md">
                      Created At: {room.createdAt.toLocaleDateString()}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    className="cursor-pointer bg-blue-500 border-2 border-dashed border-blue-400 rounded-md w-full text-center py-2 px-5 text-md hover:bg-blue-600 hover:border-blue-600"
                    onClick={() => router.push(`/room/${room.id}`)}
                  >
                    Join Room
                  </button>
                  <button
                    className="bg-red-400 p-2 border-2 border-dashed border-red-300 rounded-md ml-2 cursor-pointer hover:bg-red-600 hover:border-red-600"
                    onClick={() => handleDelete(room.id)}
                  >
                    <Trash />
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
