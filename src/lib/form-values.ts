/**
 * React resets a form after its server action finishes. To keep what people typed
 * when an action returns an error, actions send the submitted values back and
 * inputs use them as default values. Secrets are never echoed back.
 */
export type FormValues = Record<string, string | string[]>;

const SECRET = new Set(["password", "confirm", "current", "code", "website"]);

export function keepValues(formData: FormData): FormValues {
  const out: FormValues = {};
  for (const key of new Set(formData.keys())) {
    if (SECRET.has(key) || key.startsWith("$ACTION")) continue;
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return out;
}

export const val = (values: FormValues | undefined, key: string, fallback = "") => {
  const v = values?.[key];
  return Array.isArray(v) ? v[0] ?? fallback : v ?? fallback;
};

export const vals = (values: FormValues | undefined, key: string, fallback: string[] = []) => {
  const v = values?.[key];
  return v === undefined ? fallback : Array.isArray(v) ? v : [v];
};
