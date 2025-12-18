"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== newPasswordConfirm) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError("E-Mail oder aktuelles Passwort ist falsch.");
        } else if (res.status === 500) {
          setError("Fehler bei der Passwortänderung oder DB-Verbindung.");
        } else {
          setError(data?.message || "Anfrage fehlgeschlagen.");
        }
        return;
      }

      setSuccess("Passwort wurde erfolgreich geändert. Sie werden zum Dashboard weitergeleitet.");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Verbindung zur Datenbank nicht möglich.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mt-24 flex min-h-[calc(100vh-80px)] items-center justify-center bg-black/80">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/pictures/picture2.jpeg"
          alt="Hintergrundbild Passwort ändern"
          className="h-full w-full object-cover blur-sm"
        />
        <div className="absolute inset-y-0 left-0 w-8 bg-white" />
        <div className="absolute inset-y-0 right-0 w-8 bg-white" />
      </div>

      <div className="absolute inset-0 bg-black/20" />

      <section className="relative z-10 w-full max-w-xl rounded-[32px] bg-white px-6 py-8 shadow-2xl sm:max-w-xl sm:px-12 sm:py-12 md:px-25 md:py-7 ">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-green-700 sm:text-4xl">
            Passwort ändern
          </h1>
          <p className="mt-4 text-sm text-neutral-700">
            Bitte geben Sie Ihre E-Mail, Ihr aktuelles Passwort und ein neues
            Passwort ein.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700"></label>
            <input
              type="email"
              required
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="benutzer@fh-joanneum.at"
              pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700"></label>
            <input
              type="password"
              required
              value={oldPassword}
              autoComplete="new-password"
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="aktuelles Passwort"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700"></label>
            <input
              type="password"
              required
              value={newPassword}
              autoComplete="new-password"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="neues Passwort"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700"></label>
            <input
              type="password"
              required
              value={newPasswordConfirm}
              autoComplete="new-password"
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="neues Passwort wiederholen"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
            />
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          {success && !error && <p className="text-center text-sm text-green-700">{success}</p>}

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[200px] justify-center rounded-full bg-green-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70"
            >
              {loading ? "Wird geändert..." : "Passwort ändern"}
            </button>
          </div>

          <div className="pt-2 text-center text-xs text-neutral-600">
            <span>Zurück zum </span>
            <Link
              href="/login"
              className="font-semibold text-green-700 underline-offset-2 hover:underline"
            >
              Login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
