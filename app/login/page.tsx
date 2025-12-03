"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError("Das Passwort ist falsch.");
        } else if (res.status === 500) {
          setError("Verbindung zur Datenbank nicht möglich.");
        } else if (res.status === 403) {
          setError("Dieser Account ist deaktiviert.");
        } else {
          setError(data?.message || "Login fehlgeschlagen.");
        }
        return;
      }
      
      const mustChangePassword = data.mustChangePassword;
      const role = data.role || "user";
      const username = data.username || "";

      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem("username", username);
      }

      if (mustChangePassword) {
        if (typeof window !== "undefined") {
          localStorage.setItem("forcePasswordChange", "1");
        }
        router.push("/change-password");
        return;
      }

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Es ist ein Fehler aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black/80 pt-20 pb-12 px-4 md:pt-25">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/pictures/picture2.jpeg"
          alt="Hintergrundbild Login"
          className="h-full w-full object-cover blur-sm"
        />
      </div>

      <div className="absolute inset-0 bg-black/20" />

      <section className="relative z-12 w-full max-w-md mx-4 rounded-[32px] bg-white px-8 py-10 shadow-2xl sm:max-w-xl sm:px-12 sm:py-12 md:px-25 md:py-7">
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-green-700 sm:text-4xl md:text-5xl">
            Login
          </h1>
          <p className="mt-3 text-xs text-neutral-700 sm:text-sm sm:mt-4">
            Loggen Sie sich hier ein, um bei uns
            <br />
            einen Raum zu reservieren
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" autoComplete="off">
          <div className="relative">
            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-md sm:-left-4 sm:-top-4 sm:h-10 sm:w-10">
              <img
                src="/icons/mail.svg"
                alt="E-Mail Icon"
                className="h-4 w-4 sm:h-5 sm:w-5 filter invert"
              />
            </div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Beispiel@fh-joanneum.at"
              pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
              title="Bitte eine E-Mail-Adresse in einem gültigem Format eingeben."
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-2 pl-5 text-sm outline-none focus:border-green-800 sm:py-3 sm:pl-6"
            />
          </div>
          <div className="relative">
            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-md sm:-left-4 sm:-top-4 sm:h-10 sm:w-10">
              <img
                src="/icons/lock.svg"
                alt="Passwort Icon"
                className="h-4 w-4 sm:h-5 sm:w-5 filter invert"
              />
            </div>
            <input
              type="password"
              required
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-2 pl-5 text-sm outline-none focus:border-green-800 sm:py-3 sm:pl-6"
            />
            <div className="mt-1 text-right">
              <Link
                href="/pwforgotten"
                className="text-xs text-neutral-700 underline-offset-2 hover:text-green-700 hover:underline"
              >
                Kennwort vergessen?
              </Link>
            </div>
          </div>
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          {success && !error && (
            <p className="text-center text-sm text-green-700">
              Login erfolgreich.
            </p>
          )}
          <div className="pt-2 pb-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[140px] justify-center rounded-full bg-green-700 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70 sm:min-w-[160px] sm:px-10 sm:py-3"
            >
              {loading ? "Wird geprüft..." : "Login"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
