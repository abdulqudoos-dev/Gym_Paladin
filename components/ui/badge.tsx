import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-primary-500/20 text-primary-400",
    secondary: "bg-accent-orange/20 text-accent-orange",
    destructive: "bg-red-500/20 text-red-400",
    outline: "border border-dark-300 text-gray-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}




