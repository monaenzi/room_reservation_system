"use client";

import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const isPwChangeRoute = pathname?.startsWith("/change-password");

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkMode = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(isDarkMode);

    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <title>Room Reservation</title>
        <link rel="icon" href="/logo.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-neutral-900">
        {!isPwChangeRoute && (
          <header>
            <NavBar />
          </header>
        )}

        <div className="flex-1 flex flex-col">{children}</div>

        {!isPwChangeRoute && (
          <footer>
            <Footer />
          </footer>
        )}

        {!isPwChangeRoute && mounted && (
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
            className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-800 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            style={{
              boxShadow: isDark
                ? "0 10px 30px rgba(159, 239, 0, 0.3)"
                : "0 10px 30px rgba(22, 163, 74, 0.3)",
            }}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.867-.867M6.343 6.343l-.867-.867m12.728 0l-.867.867M6.343 17.657l-.867.867M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        )}
      </body>
    </html>
  );
}