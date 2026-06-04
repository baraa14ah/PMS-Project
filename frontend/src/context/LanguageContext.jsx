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

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

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
    (key, fallback = "") => {
      const value = getNested(bundles[lang], key);
      if (value != null && value !== "") return value;
      const alt = getNested(bundles.ar, key);
      return alt ?? fallback ?? key;
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

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
