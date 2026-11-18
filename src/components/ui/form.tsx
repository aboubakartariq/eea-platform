"use client";

import { useFormStatus } from "react-dom";
import type { InputHTMLAttributes, ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: ReactNode }) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={cn(
          "mt-1.5 h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-navy-600 focus:ring-3 focus:ring-navy-600/15",
          error ? "border-red-500" : "border-line",
        )}
        {...input}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function TextArea({ label, name, error, rows = 5, ...rest }: { label: string; name: string; error?: string; rows?: number; required?: boolean; maxLength?: number; defaultValue?: string }) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">{label}</label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn("mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-[15px] outline-none focus:border-navy-600 focus:ring-3 focus:ring-navy-600/15", error ? "border-red-500" : "border-line")}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function SubmitButton({ children, pendingText, className, variant = "primary" }: { children: ReactNode; pendingText?: string; className?: string; variant?: "primary" | "gold" | "outline" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonClass(variant, "lg", cn("w-full disabled:opacity-60", className))}>
      {pending ? pendingText ?? "Please wait…" : children}
    </button>
  );
}

export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>;
  if (ok) return <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">{ok}</p>;
  return null;
}
