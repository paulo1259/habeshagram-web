import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-brand-500 text-white shadow-soft hover:bg-brand-600 active:scale-[0.98] disabled:bg-brand-300",
        variant === "ghost" && "bg-transparent text-ink hover:bg-brand-100 active:scale-[0.98]",
        variant === "outline" &&
          "border border-brand-200 bg-white text-ink hover:bg-brand-50 active:scale-[0.98]",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
