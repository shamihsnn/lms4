import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export default function Logo({ className, showText = false, textClassName }: LogoProps) {
  return (
    <div className={`flex items-center ${showText ? "space-x-3" : ""}`}>
      <img
        src="/logo-al-qasim.png"
        alt="AL-QASIM Clinic & Lab"
        className={
          className ||
          "h-10 w-auto object-contain drop-shadow-sm [image-rendering:auto]"
        }
        loading="eager"
      />
      {showText && (
        <div className={textClassName || "leading-tight"}>
          <div className="font-semibold text-slate-800">AL-QASIM</div>
          <div className="text-xs text-slate-500">Clinic & Lab</div>
        </div>
      )}
    </div>
  );
}


