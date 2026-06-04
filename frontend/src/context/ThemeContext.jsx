import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  useEffect,
} from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import { getDesignTokens } from "../theme";
import { useLanguage } from "./LanguageContext";

const ThemeContext = createContext();

export const useThemeMode = () => useContext(ThemeContext);

const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: "muiltr",
  stylisPlugins: [prefixer],
});

export default function CustomThemeProvider({ children }) {
  const { dir, lang } = useLanguage();
  const [mode, setMode] = useState(
    () => localStorage.getItem("themeMode") || "light",
  );

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () => createTheme(getDesignTokens(mode, dir, lang)),
    [mode, dir, lang],
  );

  const cache = dir === "rtl" ? cacheRtl : cacheLtr;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <CacheProvider key={dir} value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
}
