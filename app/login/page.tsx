"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
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
        throw new Error(data?.message || "Login fehlgeschlagen.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Es ist ein Fehler aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-80px)] items-center justify-center bg-black/80">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/Bild1.PNG"
          alt="Hintergrundbild Login"
          className="h-full w-full object-cover blur-sm"
        />
        <div className="absolute inset-y-0 left-0 w-8 bg-white" />
        <div className="absolute inset-y-0 right-0 w-8 bg-white" />
      </div>
    
      <div className="absolute inset-0 bg-black/20" />
      
      <section className="relative z-12 w-full max-w-xl rounded-[32px] bg-white px-12 py-12 shadow-2xl sm:px-25 sm:py-6">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-700 sm:text-5xl">
            Login
          </h1>
          <p className="mt-4 text-sm text-neutral-700">
            Loggen Sie sich hier ein, um bei uns
            <br />
            einen Raum zu reservieren
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* E-Mail-Feld */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-md">
              ✉️
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 pl-6 text-sm outline-none focus:border-green-800"
            />
          </div>
          <div className="relative">
            <div className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-md">
              🔒
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 pl-6 text-sm outline-none focus:border-green-800"
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
          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[160px] justify-center rounded-full bg-green-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70"
            >
              {loading ? "Wird geprüft..." : "Login"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
