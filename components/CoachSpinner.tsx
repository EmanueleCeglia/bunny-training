import Image from "next/image";

/** The resident personal trainer, spinning while he thinks. */
export default function CoachSpinner({
  size = 22,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/coach.webp"
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority
      unoptimized
      className={`animate-coach-spin shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
