"use client";

import { useState, useEffect } from "react";
import { wsClient } from "@/hooks/useWSClient";
import { useSessionStore } from "@/store/useSessionstore";
import { useShapeStore } from "@/store/useShapeStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import SessionDialog from "./SessionDialog";

const SessionButton = ({ roomId }: { roomId: string }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isConnected = useSessionStore((state) => state.isSessionStarted);
  const setIsConnected = useSessionStore((state) => state.setSessionStarted);
  const { getShapes, setShapes } = useShapeStore();
  const router = useRouter();
  const isStandalone = roomId === "standalone";

  useEffect(() => {
    setIsClient(true);
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setError(null);
  };

  const startSession = async (roomName: string) => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    setError(null);

    try {
      const standaloneShapes = getShapes("standalone");
      const serverUrl = process.env.NEXT_PUBLIC_HTTP_URL!;
      const response = await axios.post(
        `${serverUrl}/room`,
        { name: roomName },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      const newroomId = response.data.id;

      setShapes(newroomId, standaloneShapes);
      if (standaloneShapes.length > 0) {
        // Save shapes to the new room
        try {
          await axios.post(
            `${serverUrl}/bulkShapes/${newroomId}`,
            { shapes: standaloneShapes },
            {
              headers: {
                Authorization: token,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (shapesError) {
          console.error("Failed to save shapes:", shapesError);
        }
      }

      setDialogOpen(false);
      router.push(`/room/${newroomId}`);
      setIsConnected(false);
    } catch (err) {
      console.error("Failed to create standalone session", err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("A room with this name already exists. Try another name.");
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        // Stale token (user no longer exists): drop it so the user signs in again.
        localStorage.removeItem("token");
        setError("Your login is no longer valid. Please sign in again.");
        setTimeout(() => router.push("/signin"), 1500);
      } else {
        setError("Couldn't start the session. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const stopSession = () => {
    const currentShapes = getShapes(roomId);
    setShapes("standalone", currentShapes);
    wsClient.disconnect();
    setIsConnected(false);
    setError(null);
    setDialogOpen(false);
    router.push("/canvas");
  };

  const reconnect = async () => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    try {
      await wsClient.connect(roomId, token, {
        onOpen: () => {
          setIsConnected(true);
          setError(null);
        },
        onError: () => {
          setError("Failed to connect to session.");
        },
        onClose: () => {
          setIsConnected(false);
          console.warn("Disconnected from session.");
        },
      });
    } catch (err) {
      console.error("Connect failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (isStandalone) {
      if (!localStorage.getItem("token")) {
        setError("Please sign in to start a collaboration session.");
        router.push("/signin");
        return;
      }
      setDialogOpen(true);
      return;
    }

    // In a room: connected -> share dialog, disconnected -> reconnect.
    if (isConnected) {
      setDialogOpen(true);
    } else {
      reconnect();
    }
  };

  const getButtonText = () => {
    if (loading && !dialogOpen) return "Loading...";
    if (isStandalone) {
      if (!isClient) return "Loading...";
      return localStorage.getItem("token") ? "Start Session" : "Sign In to Collaborate";
    }
    return isConnected ? "Share" : "Start Session";
  };

  if (!isClient) {
    return (
      <div>
        <button
          disabled
          className="p-2 bg-[hsl(var(--icon-selected))] text-white rounded-md disabled:opacity-50"
        >
          Loading...
        </button>
      </div>
    );
  }

  const showShareIcon = !isStandalone && isConnected;

  return (
    <div>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 p-2 bg-[hsl(var(--icon-selected))] text-white rounded-md disabled:opacity-50"
      >
        {showShareIcon && <Share2 size={16} />}
        {getButtonText()}
      </button>
      {error && !dialogOpen && <p className="text-red-500 mt-2">{error}</p>}
      {dialogOpen && isStandalone && (
        <SessionDialog
          mode="start"
          loading={loading}
          error={error}
          onStart={startSession}
          onClose={closeDialog}
        />
      )}
      {dialogOpen && !isStandalone && (
        <SessionDialog
          mode="share"
          roomId={roomId}
          onStop={stopSession}
          onClose={closeDialog}
        />
      )}
    </div>
  );
};

export default SessionButton;
