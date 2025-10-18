import * as React from "react";
import { cn } from "@/lib/utils";

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
};

export function Avatar({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) {
  const sizes: Record<NonNullable<AvatarProps["size"]>, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  return (
    <div
      className={cn(
        "rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-orange text-white flex items-center justify-center",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || "avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold">{fallback?.slice(0, 1).toUpperCase() || "U"}</span>
      )}
    </div>
  );
}




