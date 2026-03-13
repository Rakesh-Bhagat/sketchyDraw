"use client";
import Canvas from "@/components/Canvas";
import RoomParticipants from "@/components/RoomParticipants";
import SessionButton from "@/components/SessionButton";
import ToolBox from "@/components/ToolBox";
import { wsClient } from "@/hooks/useWSClient";
import { useSessionStore } from "@/store/useSessionstore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CanvasBoard = () => {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string | undefined;
  // console.log("roomId:", roomId);

  const isSessionStarted = useSessionStore((state) => state.isSessionStarted);
  const setSessionStarted = useSessionStore((state) => state.setSessionStarted);
  const setParticipants = useSessionStore((state) => state.setParticipants);
  const [authCheck, setAuthCheck] = useState(false)

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/signin')
    }else{
      setAuthCheck(true)
    }
  }, [router])
   useEffect(() => {
    if (!authCheck || !roomId || isSessionStarted) return;
    // console.log(roomId)

    const token = localStorage.getItem("token") || "";

    wsClient.connect(roomId, token, {
      
      onOpen: () => {
        setSessionStarted(true);
        // console.log("Auto-connected to WebSocket session");
      },
      onParticipantsUpdate: (participants) => {
        setParticipants(participants);
      },
      onError: (err) => {
        console.error("WebSocket connection error", err);
      },
      onClose: () => {
        setSessionStarted(false);
        setParticipants([]);
        // console.warn("WebSocket disconnected");
      },
    });
  }, [roomId, isSessionStarted, setSessionStarted, setParticipants, authCheck]);

  useEffect(() => {
    return () => {
      setParticipants([]);
    };
  }, [setParticipants]);

  if(!authCheck) return null;
  return (
    <div className="flex relative justify-center">
      <div className="absolute z-10 bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:bottom-auto sm:top-3 sm:w-auto sm:flex sm:justify-center">
        <ToolBox />
      </div>
      <div className="z-12 flex absolute top-4 right-3 items-center gap-2 max-sm:p-0 sm:top-auto sm:bottom-4 sm:right-4 sm:rounded-xl sm:border sm:border-white/10 sm:bg-[hsl(var(--toolbox))]/85 sm:p-2 sm:backdrop-blur-sm">
        <RoomParticipants />
        <div className="hidden sm:block">
          <SessionButton roomId={roomId!} />
        </div>
      </div>
      <div>
        <Canvas />
      </div>
    </div>
  );
};

export default CanvasBoard;
