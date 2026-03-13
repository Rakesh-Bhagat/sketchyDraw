"use client";

import { useSessionStore } from "@/store/useSessionstore";

const RoomParticipants = () => {
  const participants = useSessionStore((state) => state.participants);

  if (!participants.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {participants.map((participant) => {
        const label = (participant.name || "U").trim();
        const initial = label.charAt(0).toUpperCase() || "U";

        return (
          <div
            key={participant.userId}
            title={label}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#7ee57e] bg-[#a8ffa8] text-xs font-semibold uppercase text-[#0f3d0f]"
          >
            {initial}
          </div>
        );
      })}
    </div>
  );
};

export default RoomParticipants;
