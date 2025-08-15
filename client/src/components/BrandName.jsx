import { useTheme } from "../context/ThemeContext.jsx";

export default function BrandName({ className = "", variant = "default" }) {
  const { darkMode } = useTheme();
  const isWhite = variant === "white";
  
  // Automatically adjust colors based on theme or variant
  const codeColor = isWhite ? "text-white" : darkMode ? "text-gray-200" : "text-black";
  const deskColor = isWhite ? "text-white" : darkMode ? "text-yellow-400" : "text-[#e67829]";

  return (
    <span className={className}>
      <span className={codeColor}>Code</span>
      <span className={deskColor}>Desk</span>
    </span>
  );
}
