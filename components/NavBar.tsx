"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function NavBar() {
    const pathname = usePathname();
    
    const navLinks = [
        { href: "/", label: "Startseite" },
        { href: "/rooms", label: "Räume" },
        { href: "/calender", label: "Kalender" },
        { href: "/login", label: "Userverwaltung" },
    ];

return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-white/70 backdrop-blur-md shadow-[0_6px_10px_rgba(0,0,0,0.25)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 text-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="KAIT Logo" width={80} height={32} />
        </Link>

        <ul className="flex gap-20 text-gray-700 text-lg">
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

        <Link href="/login" aria-label="Login" className="flex items-center">
          <Image src="/icons/login.svg" alt="Login" width={35} height={35} />
        </Link>
      </div>
    </nav>
  );
}
