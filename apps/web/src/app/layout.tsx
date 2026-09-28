import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

export const metadata: Metadata = {
  title: "Wealthly — Personal Finance",
  description: "Small steps. Bigger tomorrows.",
};

const foucScript = `
  (function() {
    try {
      var cookies = document.cookie.split('; ');
      var theme = 'system';
      var accent = 'green';
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split('=');
        if (parts[0] === 'wealthly_theme') theme = parts[1];
        if (parts[0] === 'wealthly_accent') accent = parts[1];
      }
      var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-accent', accent);
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: foucScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}