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
        "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold tracking-[-0.01em] transition duration-200 ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-gradient-to-br from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm hover:-translate-y-0.5 hover:shadow-glow hover:brightness-110 active:translate-y-0 active:scale-[0.985] disabled:from-brand-300 disabled:to-brand-300 disabled:shadow-none",
        variant === "ghost" &&
          "bg-transparent text-stone-600 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.985]",
        variant === "outline" &&
          "border border-brand-200 bg-brand-50/50 text-brand-700 hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-brand-100 hover:shadow-glow-sm active:translate-y-0 active:scale-[0.985]",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
