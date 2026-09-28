"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

export type Accent =
  | "green"
  | "blue"
  | "purple"
  | "rose"
  | "amber"
  | "mono";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  accent: "green",
  setAccent: () => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches);

  root.classList.toggle("dark", dark);
}

function applyAccent(accent: Accent) {
  document.documentElement.setAttribute(
    "data-accent",
    accent
  );
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] =
    useState<Theme>("light");

  const [accent, setAccentState] =
    useState<Accent>("purple");

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const response = await fetch(
          "/api/preferences",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (
          data.theme === "light" ||
          data.theme === "dark" ||
          data.theme === "system"
        ) {
          setThemeState(data.theme);
        }

        if (
          data.accent === "green" ||
          data.accent === "blue" ||
          data.accent === "purple" ||
          data.accent === "rose" ||
          data.accent === "amber" ||
          data.accent === "mono"
        ) {
          setAccentState(data.accent);
        }
      } catch (error) {
        console.error(
          "Failed to load preferences:",
          error
        );
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
    applyAccent(accent);

    document.cookie =
      `wealthly_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;

    document.cookie =
      `wealthly_accent=${accent}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme, accent]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    applyTheme(newTheme);

    void fetch("/api/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        theme: newTheme,
        accent,
      }),
    }).catch((error) => {
      console.error(
        "Failed to save theme preference:",
        error
      );
    });
  };

  const setAccent = (newAccent: Accent) => {
    setAccentState(newAccent);

    applyAccent(newAccent);

    void fetch("/api/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        theme,
        accent: newAccent,
      }),
    }).catch((error) => {
      console.error(
        "Failed to save accent preference:",
        error
      );
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accent,
        setAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
