import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ar from "../i18n/locales/ar";
import en from "../i18n/locales/en";

const STORAGE_KEY = "bytehub_lang";

const bundles = { ar, en };

const LanguageContext = createContext(null);

/** Reads a dotted i18n key from a locale bundle object. */
function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/** Provides language, direction, and the `t()` translation helper. */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "ar",
  );

  const setLang = useCallback((next) => {
    const value = next === "en" ? "en" : "ar";
    setLangState(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = useCallback(
    (key, params = "") => {
      let text = getNested(bundles[lang], key);
      if ((text == null || text === "") && lang === "ar") {
        text = getNested(bundles.en, key);
      }
      if (text == null || text === "") {
        text = typeof params === "string" ? params : key;
      }
      if (params && typeof params === "object") {
        Object.entries(params).forEach(([k, v]) => {
          text = String(text).replaceAll(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, dir, isRtl, t }),
    [lang, setLang, dir, isRtl, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** Hook for language state and translations. */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
