"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { LanguageMenu } from "./language-menu";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, href } = useI18n();
  // Five top-level items so the menu fits in every language; the rest sit in two drop-downs.
  const mainNav = [
    {
      label: t.nav.competitions,
      href: href("/competitions"),
      children: [
        { label: t.nav.allCompetitions, href: href("/competitions"), description: t.nav.allCompetitionsHint },
        { label: t.nav.olympiads, href: href("/olympiads"), description: t.nav.olympiadsHint },
        { label: t.nav.extracurricular, href: href("/activities"), description: t.nav.extracurricularHint },
        { label: t.nav.resources, href: href("/resources"), description: t.resources.title },
      ],
    },
    { label: t.nav.schools, href: href("/schools") },
    { label: t.nav.students, href: href("/students") },
    { label: t.nav.results, href: href("/results") },
    {
      label: t.nav.about,
      href: href("/about"),
      children: [
        { label: t.footer.aboutUs, href: href("/about"), description: t.about.valuesTitle },
        { label: t.nav.news, href: href("/news"), description: t.news.title },
        { label: t.nav.contact, href: href("/contact"), description: t.contact.title },
      ],
    },
  ] as { label: string; href: string; children?: { label: string; href: string; description: string }[] }[];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-shadow",
        scrolled ? "border-line shadow-[0_6px_24px_-12px_rgba(20,22,74,0.18)]" : "border-transparent",
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-6">
        <Link href={href("/")} className="flex items-center gap-3" aria-label={`Educational Extracurricular Activities, ${t.common.home}`}>
          <Image src="/brand/eea-seal.svg" alt="" width={46} height={46} priority />
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[15px] font-bold tracking-wide text-navy-800">EEA</span>
            <span className="block text-[11px] font-medium whitespace-nowrap text-muted" lang="en">Educational Extracurricular Activities</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) =>
              item.children ? (
                <li key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-ink hover:bg-navy-50 hover:text-navy-700"
                  >
                    {item.label}
                    <ChevronDown className="size-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
                  </Link>
                  <div className="invisible absolute top-full start-0 pt-2 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="w-72 rounded-2xl border border-line bg-white p-2 shadow-xl shadow-navy-900/10">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link href={child.href} className="block rounded-xl px-4 py-3 hover:bg-surface">
                            <span className="block text-sm font-semibold text-navy-900">{child.label}</span>
                            <span className="block text-xs text-muted">{child.description}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-ink hover:bg-navy-50 hover:text-navy-700"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Suspense fallback={<span className="hidden w-16 sm:block" />}>
            <LanguageMenu className="hidden sm:block" />
          </Suspense>
          <Link href={href("/register")} className={buttonClass("gold", "md", "hidden sm:inline-flex")}>
            {t.common.registerNow}
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-navy-800 hover:bg-navy-50 lg:hidden"
            aria-label={open ? t.common.closeMenu : t.common.openMenu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 top-18 bottom-0 z-40 overflow-y-auto bg-white px-5 pb-10 transition-all duration-200 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav aria-label="Mobile">
          <ul className="divide-y divide-line">
            {mainNav.flatMap((item) => item.children ?? [item]).map((item) => (
              <li key={item.href + item.label}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block py-4 text-lg font-semibold text-navy-900">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={href("/register")} onClick={() => setOpen(false)} className={buttonClass("gold", "lg", "mt-6 w-full")}>
            {t.common.registerNow}
          </Link>
          <Suspense fallback={null}>
            <LanguageMenu full className="mt-6" onPick={() => setOpen(false)} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
