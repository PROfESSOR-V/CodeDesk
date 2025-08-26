import React from "react";

export default function BrandName({ className = "", variant = "default" }) {
  const isWhite = variant === "white";
  const codeColor = isWhite ? "text-white" : "text-black";
  const deskColor = isWhite ? "text-white" : "text-[#e67829]";
  return (
    <span className={className}>
      <span className={codeColor}>Code</span>
      <span className={deskColor}>Desk</span>
    </span>
  );
} 