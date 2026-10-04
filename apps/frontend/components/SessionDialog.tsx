"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Play, X } from "lucide-react";

type StartProps = {
  mode: "start";
  loading: boolean;
  error: string | null;
  onStart: (roomName: string) => void;
  onClose: () => void;
};

type ShareProps = {
  mode: "share";
  roomId: string;
  onStop: () => void;
  onClose: () => void;
};

const Shell = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Portal to <body>: an ancestor with backdrop-filter would otherwise become the
  // containing block for `fixed` and squash the dialog into that panel.
  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[hsl(var(--toolbox))] p-6 text-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10"
        >
          <X size={16} />
        </button>
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
};

const PrivacyNote = () => (
  <p className="text-sm text-white/60">
    Anyone with the link can join this room once they sign in. Shapes are saved to
    the room so they&apos;re still there when you come back.
  </p>
);

const SessionDialog = (props: StartProps | ShareProps) => {
  const [roomName, setRoomName] = useState("");
  const [copied, setCopied] = useState(false);

  if (props.mode === "start") {
    const { loading, error, onStart, onClose } = props;
    const submit = () => {
      if (roomName.trim() && !loading) onStart(roomName.trim());
    };

    return (
      <Shell title="Live collaboration" onClose={onClose}>
        <p className="mb-4 text-sm text-white/70">
          Invite people to collaborate on your drawing.
        </p>
        <label htmlFor="room-name" className="mb-1 block text-sm font-medium">
          Room name
        </label>
        <input
          id="room-name"
          autoFocus
          value={roomName}
          maxLength={60}
          placeholder="e.g. Sprint planning"
          onChange={(e) => setRoomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[hsl(var(--icon-selected))]"
        />
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <div className="mb-4">
          <PrivacyNote />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!roomName.trim() || loading}
          className="mx-auto flex items-center gap-2 rounded-lg bg-[hsl(var(--icon-selected))] px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          <Play size={16} />
          {loading ? "Starting..." : "Start session"}
        </button>
      </Shell>
    );
  }

  const link = `${window.location.origin}/room/${props.roomId}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is still selectable in the field.
    }
  };

  return (
    <Shell title="Live collaboration" onClose={props.onClose}>
      <label htmlFor="room-link" className="mb-1 block text-sm font-medium">
        Link
      </label>
      <div className="mb-4 flex gap-2">
        <input
          id="room-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={copyLink}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[hsl(var(--icon-selected))] px-4 py-2 text-sm font-semibold text-white"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="mb-4 border-t border-white/10 pt-3">
        <PrivacyNote />
      </div>
      <button
        type="button"
        onClick={props.onStop}
        className="mx-auto block rounded-lg border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10"
      >
        Stop session
      </button>
      <p className="mt-2 text-center text-xs text-white/50">
        Stopping disconnects you and keeps a local copy of the scene. Others stay in the
        room.
      </p>
    </Shell>
  );
};

export default SessionDialog;
