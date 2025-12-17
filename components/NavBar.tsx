"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Role = "guest" | "user" | "admin";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000;

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<Role>("guest");
  const [username, setUsername] = useState<string>("");
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();


  const updateActivity = () => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (isLoggedIn) {
        localStorage.setItem("lastActivityTime", Date.now().toString());
      }
    }
  };


  /*     const navLinks = [
          { href: "/", label: "Startseite" },
          { href: "/rooms", label: "Räume" },
          { href: "/calender", label: "Kalender" },
          { href: "/login", label: "Userverwaltung" },
      ]; */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const storedRole = (localStorage.getItem("userRole") as Role) || "guest";
    const storedUsername = localStorage.getItem("username") || "";

    if (!isLoggedIn) {
      setRole("guest");
      setUsername("");
    } else if (storedRole === "admin") {
      setRole("admin");
      setUsername(storedUsername);
      updateActivity();
    } else {
      setRole("user");
      setUsername(storedUsername);
      updateActivity();
    }
  }, [pathname]);

  async function handleLogout() {

    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }

    await fetch("/api/logout", { method: "POST" });

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("forcePasswordChange");
    localStorage.removeItem("lastActivityTime");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

    setShowLogoutWarning(false);
    setRole("guest");

    router.push("/login");
  }



  const checkInactivity = () => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) return;

    const lastActivity = localStorage.getItem("lastActivityTime");
    if (!lastActivity) {
      updateActivity();
      return;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
    const warningTime = INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT;

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      handleLogout();
    } else if (timeSinceLastActivity >= warningTime && !showLogoutWarning) {
      setShowLogoutWarning(true);
    }
  };


  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) return;

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const handleUserActivity = () => {
      updateActivity();
      setShowLogoutWarning(false);
    };

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    inactivityTimerRef.current = setInterval(checkInactivity, 30000);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [role]);


  const commonLinks = [
    { href: "/", label: "Startseite" },
    { href: "/rooms", label: "Räume" },
    { href: "/calender", label: "Kalender" },
  ];

  const adminLinks =
    role === "admin"
      ? [
        { href: "/admin/users", label: "Userverwaltung" },
      ]
      : [];
  const navLinks = [...commonLinks, ...adminLinks];

  return (
    <>
      <nav className="w-full fixed top-0 left-0 z-50 bg-white/70 backdrop-blur-md shadow-[0_6px_10px_rgba(0,0,0,0.25)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3 text-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="KAIT Logo" width={80} height={32} className="w-16 h-auto sm:w-20" />
          </Link>

          <ul className="hidden md:flex gap-10 lg:gap-20 text-gray-700 text-base lg:text-lg">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "text-green-700 font-semibold border-b-2 border-green-700 pb-1"
                      : "hover:text-green-700 transition-colors"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {role === "guest" ? (
            <Link
              href="/login"
              aria-label="Login"
              className="hidden md:flex items-center hover:opacity-80 transition-opacity"
            >
              <Image src="/icons/login.svg" alt="Login" width={35} height={35} />
            </Link>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center gap-0.5">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Image src="/icons/logout.svg" alt="Logout" width={35} height={35} />
              </button>
              {username && (
                <span className="text-xs font-semibold text-green-800 leading-tight">
                  Hallo, {username}!
                </span>
              )}


            </div>
          )}

          <button type="button" className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:text-green-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-700" aria-label="Navigation umschalten" aria-expanded={isOpen} onClick={() => setIsOpen((prev) => !prev)}>
            {!isOpen ? (
              <Image src="/icons/menu.svg" alt="Menü öffnen" width={26} height={26} />
            ) : (
              <Image src="/icons/x.svg" alt="Menü schließen" width={26} height={26} />
            )}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="mmax-w-7xl mx-auto px-4 py-3 flex flex-col items-center">
              {role !== "guest" && username && (
                <div className="mb-2 text-green-800 font-semi-bold border-b border-gray-200 pb-2 w-full text-center">
                  Hallo, {username}!
                </div>
              )}
              <ul className="flex flex-col gap-3 text-gray-800 text-base items-center text-center">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={pathname === link.href ? "block py-1 text-green-700 font-semibold" : "block py-1 hover:text-green-700"} onClick={() => setIsOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-3">
                {role === "guest" ? (
                  <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-green-700 px-3 py-1.5 text-sm font-medium text-green-700" onClick={() => setIsOpen(false)}>
                    <Image src="/icons/login.svg" alt="Login" width={22} height={22} />
                    <span>Login</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-green-700 px-3 py-1.5 text-sm font-medium text-green-700"
                  >
                    <Image
                      src="/icons/logout.svg"
                      alt="Logout"
                      width={22}
                      height={22}
                    />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>


      {showLogoutWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 max-w-md mx-4 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Automatischer Logout
            </h2>
            <p className="text-gray-600 mb-4">
              Sie werden in 2 Minuten aufgrund von Inaktivität automatisch ausgeloggt.
            </p>
            <p className="text-sm text-gray-500">
              Sie werden in wenigen Sekunden zur Login-Seite weitergeleitet...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
