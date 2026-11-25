import React from "react";
import symbolImg from "../assets/openverse-symbol.png";

interface OpenVerseSymbolProps {
  className?: string;
  size?: number;
}

export const OpenVerseSymbol: React.FC<OpenVerseSymbolProps> = ({
  className = "size-7",
  size = 28,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-tr from-slate-950 via-indigo-950 to-violet-950 p-1 border border-violet-500/30 shadow-sm shadow-violet-900/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={symbolImg}
        alt="OPEN-VERSE"
        className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]"
      />
    </div>
  );
};
