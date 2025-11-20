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
    <main className="relative flex min-h-[calc(100vh-80px)] items-center justify-center bg-black/80">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/pictures/picture2.jpeg"
          alt="Hintergrundbild Passwort vergessen"
          className="h-full w-full object-cover blur-sm"
        />
        <div className="absolute inset-y-0 left-0 w-8 bg-white" />
        <div className="absolute inset-y-0 right-0 w-8 bg-white" />
      </div>

      <div className="absolute inset-0 bg-black/20" />
      <section className="relative z-10 w-full max-w-xl rounded-[32px] bg-white px-10 py-12 shadow-2xl sm:px-14 sm:py-14">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700 sm:text-4xl">
            Passwort vergessen
          </h1>
          <p className="mt-4 text-sm text-neutral-700">
            Bitte geben Sie Ihre Daten ein. Wir prüfen,
            <br />
            ob ein Konto mit diesen Angaben existiert.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* E-Mail */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-md">
                <img 
                src="/icons/mail.svg" 
                alt="E-Mail Icon" 
                className="h-5 w-5 filter invert" 
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
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 pl-6 text-sm outline-none focus:border-green-800"
            />
          </div>
          <div className="relative">
            <div className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-md">
                <img 
                src="/icons/user.svg" 
                alt="E-Mail Icon" 
                className="h-5 w-5 filter invert" 
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
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 pl-6 text-sm outline-none focus:border-green-800"
            />
          </div>
          <div className="relative">
            <div className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-md">
                <img 
                src="/icons/user.svg" 
                alt="E-Mail Icon" 
                className="h-5 w-5 filter invert" 
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
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 pl-6 text-sm outline-none focus:border-green-800"
            />
          </div>
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          {success && !error && (
            <p className="text-center text-sm text-green-700">
              Wenn ein Konto mit diesen Daten existiert, wurde eine E-Mail
              versendet.
            </p>
          )}
          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[180px] justify-center rounded-full bg-green-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70"
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