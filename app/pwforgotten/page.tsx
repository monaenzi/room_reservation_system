"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function PasswordForgottenPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/pwforgotten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404) {
          setError(
            "Zu dieser E-Mail existiert kein Benutzerkonto."
          );
        } else if (res.status === 500) {
          setError("Verbindung zur Datenbank oder Mailversand nicht möglich.");
        } else {
          setError(data?.message || "Anfrage fehlgeschlagen.");
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Verbindung zur Datenbank oder Mailserver nicht möglich.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black/80 pt-15 md:pt-35 md:pb-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/pictures/picture2.jpeg"
          alt="Hintergrundbild Passwort vergessen"
          className="h-full w-full object-cover blur-sm"
        />
      </div>

      <div className="absolute inset-0 bg-black/20" />
      <section className="relative z-10 w-full max-w-md mx-4 rounded-[32px] bg-white px-8 py-10 shadow-2xl sm:max-w-xl sm:px-10 sm:py-12 md:px-14 md:py-14">
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-green-700 sm:text-3xl md:text-4xl">
            Passwort vergessen
          </h1>
          <p className="mt-3 text-xs text-neutral-700 sm:text-sm sm:mt-4">
            Bitte geben Sie Ihre Daten ein. Wir prüfen,
            <br />
            ob ein Konto mit diesen Angaben existiert.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="relative">
            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-md sm:-left-4 sm:-top-4 sm:h-10 sm:w-10">
                <img 
                src="/icons/mail.svg" 
                alt="E-Mail Icon" 
                className="h-4 w-4 sm:h-5 sm:w-5 filter invert" 
                />
            </div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Beispiel@fh-joanneum.at"
              pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
              title="Bitte eine gültige E-Mail-Adresse im Format name@domain.tld eingeben."
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-2 pl-5 text-sm outline-none focus:border-green-800 sm:py-3 sm:pl-6"
            />
          </div>
          <div className="relative">
            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-md sm:-left-4 sm:-top-4 sm:h-10 sm:w-10">
                <img 
                src="/icons/user.svg" 
                alt="User Icon" 
                className="h-4 w-4 sm:h-5 sm:w-5 filter invert" 
                />
            </div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Vorname"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-2 pl-5 text-sm outline-none focus:border-green-800 sm:py-3 sm:pl-6"
            />
          </div>
          <div className="relative">
            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-md sm:-left-4 sm:-top-4 sm:h-10 sm:w-10">
                <img 
                src="/icons/user.svg" 
                alt="User Icon" 
                className="h-4 w-4 sm:h-5 sm:w-5 filter invert" 
                />
            </div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nachname"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-2 pl-5 text-sm outline-none focus:border-green-800 sm:py-3 sm:pl-6"
            />
          </div>
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          {success && !error && (
            <p className="text-center text-xs text-green-700 sm:text-sm">
              Wenn ein Konto mit diesen Daten existiert, wurde eine E-Mail
              versendet.
            </p>
          )}
          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[160px] justify-center rounded-full bg-green-700 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70 sm:min-w-[180px] sm:px-10 sm:py-3 cursor-pointer"
            >
              {loading ? "Wird geprüft..." : "Anfrage senden"}
            </button>
          </div>
          <div className="pt-2 text-center text-xs text-neutral-600">
             <span>Nochmals versuchen? </span>
            <Link
              href="/login"
              className="font-semibold text-green-700 underline-offset-2 hover:underline"
            >
              Zurück zum Login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}