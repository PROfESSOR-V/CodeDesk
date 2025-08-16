export default function BrandName({ className = "", variant = "default" }) {
  const isWhite = variant === "white";

  // outer classes
  const outerClasses = `${className} font-extrabold tracking-wide`;

  // inner colors
  const codeColor = isWhite ? "text-white" : "text-gray-900 dark:text-white";
  const deskColor = isWhite ? "text-white" : "text-[#e67829]"; // always orange

  return (
    <span className={outerClasses}>
      <span className={codeColor}>Code</span>
      <span className={deskColor}>Desk</span>
    </span>
  );
}
