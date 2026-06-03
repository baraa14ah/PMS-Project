import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  useEffect,
} from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { getDesignTokens } from "../theme";

const ThemeContext = createContext();

export const useThemeMode = () => useContext(ThemeContext);

export default function CustomThemeProvider({ children }) {
  // جلب الوضع من المتصفح ليبقى محفوظاً
  const [mode, setMode] = useState(
    () => localStorage.getItem("themeMode") || "light",
  );

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
