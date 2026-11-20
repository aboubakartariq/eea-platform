import { fill } from "./config";

/** English text → translated text. Missing entries fall back to English. */
export type Catalogue = Record<string, string>;
export type Vars = Record<string, string | number | null | undefined | boolean>;

/** Like JSX: null, undefined and false print nothing. */
const clean = (v: Vars) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x == null || x === false ? "" : typeof x === "boolean" ? "" : x]));

const patternCache = new WeakMap<Catalogue, { re: RegExp; names: string[]; key: string }[]>();

/** Keys with {placeholders}, compiled once so messages built on the server ("Row 4: …") can be matched. */
function patterns(cat: Catalogue) {
  let list = patternCache.get(cat);
  if (!list) {
    list = Object.keys(cat)
      .filter((k) => k.includes("{"))
      .sort((a, b) => b.length - a.length)
      .map((key) => {
        const names: string[] = [];
        const src = key
          .split(/(\{\w+\})/)
          .map((part) => {
            const m = part.match(/^\{(\w+)\}$/);
            if (m) {
              names.push(m[1]);
              return "(.+?)";
            }
            return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          })
          .join("");
        return { re: new RegExp(`^${src}$`, "s"), names, key };
      });
    patternCache.set(cat, list);
  }
  return list;
}

/**
 * Builds the two helpers pages use:
 * - tr("Sign in") or tr("Signed in as {email}.", { email }) for text written in the code;
 * - msg(text) for text that arrives already built, such as an error from a form action.
 */
export function makeTr(cats: Catalogue[]) {
  const lookup = (s: string) => {
    for (const c of cats) if (s in c) return c[s];
    return undefined;
  };
  const tr = (s: string, vars?: Vars) => {
    const out = lookup(s) ?? s;
    return vars ? fill(out, clean(vars)) : out;
  };
  const msg = (s: string | undefined | null, depth = 0): string | undefined => {
    if (s == null || s === "") return s ?? undefined;
    const exact = lookup(s);
    if (exact !== undefined) return exact;
    if (depth > 2) return s;
    for (const c of cats) {
      for (const p of patterns(c)) {
        const m = s.match(p.re);
        if (!m) continue;
        const vars: Record<string, string> = {};
        p.names.forEach((n, i) => (vars[n] = msg(m[i + 1], depth + 1) ?? m[i + 1]));
        return fill(c[p.key], vars);
      }
    }
    // A message made of several sentences ("Saved. Check them…"): translate each one.
    if (depth === 0) {
      const parts = s.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      if (parts.length > 1) return parts.map((p) => msg(p, 1) ?? p).join(" ");
    }
    return s;
  };
  function publicMsg(s: string): string;
  function publicMsg(s: string | undefined | null): string | undefined;
  function publicMsg(s: string | undefined | null) {
    return msg(s);
  }
  return { tr, msg: publicMsg };
}

export type Tr = ReturnType<typeof makeTr>["tr"];
export type Msg = ReturnType<typeof makeTr>["msg"];

/** Marks English text that is translated later, where it is shown (for example labels kept in a list at the top of a file). */
export const N_ = <T extends string>(s: T) => s;
