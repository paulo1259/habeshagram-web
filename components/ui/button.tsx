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
        "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "bg-brand-500 text-white shadow-soft hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-md active:translate-y-0 active:scale-[0.985] disabled:bg-brand-300",
        variant === "ghost" &&
          "bg-transparent text-ink hover:bg-brand-100/80 hover:text-brand-900 active:scale-[0.985]",
        variant === "outline" &&
          "border border-brand-200 bg-white/90 text-ink shadow-sm hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 active:translate-y-0 active:scale-[0.985]",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
