"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Role = "guest" | "user" | "admin";

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<Role>("guest");
  const router = useRouter();

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

    if (!isLoggedIn) {
      setRole("guest");
    } else if (storedRole === "admin") {
      setRole("admin");
    } else {
      setRole("user");
    }
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("forcePasswordChange");
    setRole("guest");
    router.push("/");
  }

  const commonLinks = [
    { href: "/", label: "Startseite" },
    { href: "/rooms", label: "Räume" },
    { href: "/calender", label: "Kalender" }, 
  ];

  const adminLinks = 
    role === "admin"
      ? [
        { href: "/admin/users", label: "Userverwaltung" },
        { href: "/admin/tools", label: "Admintools" },
        // href: "/admin/calendar", label: "Kalender" }, // Hier muss noch eingerichtet werden, dass admin nur diese Kalenderansicht hat und nicht auch den default Kalender aus den commonlinks
      ]
      : [];
  const navLinks = [...commonLinks, ...adminLinks];

  return (
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
            className="hidden md:flex items-center"
          >
            <Image src="/icons/login.svg" alt="Login" width={35} height={35} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="hidden md:flex items-center"
          >
            <Image src="/icons/logout.svg" alt="Logout" width={35} height={35} />
          </button>
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
  );
}
