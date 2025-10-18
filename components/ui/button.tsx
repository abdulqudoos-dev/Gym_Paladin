"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link";
  size?: "sm" | "md" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50";

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
      icon: "h-10 w-10",
    };

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default:
        "bg-gradient-to-r from-primary-500 to-accent-orange text-white hover:from-primary-600 hover:to-accent-orange/90 shadow hover:shadow-primary-500/30",
      secondary:
        "bg-dark-400/60 text-gray-100 border border-dark-300 hover:border-primary-500/40",
      outline:
        "bg-transparent border border-dark-300 text-gray-100 hover:border-primary-500/50",
      ghost: "bg-transparent text-gray-300 hover:text-white",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      link: "bg-transparent underline-offset-4 hover:underline text-primary-400",
    };

    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";




