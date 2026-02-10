import React from "react";

type Props = {
  children: React.ReactNode;
  bg?: string; // "/lobby.png" 등 public 경로
};

export default function GameFrame({ children, bg = "/lobby.png" }: Props) {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
        style={{
          width: "min(1400px, calc(100vw - 48px))",
          aspectRatio: "16 / 9",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  );
}
