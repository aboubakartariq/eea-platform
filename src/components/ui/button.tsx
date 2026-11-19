import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "gold" | "outline" | "ghost" | "white";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-navy-600 text-white hover:bg-navy-700 shadow-sm shadow-navy-900/10",
  gold: "bg-gold text-navy-900 hover:bg-[#f9a540] shadow-sm shadow-gold-700/20",
  outline: "border border-navy-200 text-navy-700 hover:border-navy-600 hover:bg-navy-50",
  ghost: "text-navy-700 hover:bg-navy-50",
  white: "bg-white text-navy-800 hover:bg-navy-50",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 whitespace-nowrap",
    variants[variant],
    sizes[size],
    className,
  );

type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function LinkButton({ variant, size, className, children, ...props }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
