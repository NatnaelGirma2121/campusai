export function TraceDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      className={`w-full h-4 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 8 H70 L82 2 H130 L142 8 H200"
        fill="none"
        stroke="#232E3D"
        strokeWidth="1.5"
      />
      <circle cx="82" cy="2" r="2" fill="#C08552" />
      <circle cx="142" cy="8" r="2" fill="#5B8DEF" />
    </svg>
  );
}
