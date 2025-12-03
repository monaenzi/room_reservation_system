"use client";

import { FormEvent, useState } from "react";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("0"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          first_name: firstName,
          last_name: lastName,
          role_id: Number(roleId),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setError("Benutzername oder E-Mail ist bereits vergeben.");
        } else if (res.status === 500) {
          setError("Fehler beim Anlegen des Users oder DB-Verbindung.");
        } else {
          setError(data?.message || "Anfrage fehlgeschlagen.");
        }
        return;
      }

      setSuccess(
        `User erfolgreich angelegt. Default-Passwort für Erstanmeldung: Raum123!`
      );

      // Felder leeren
      setEmail("");
      setUsername("");
      setFirstName("");
      setLastName("");
      
    } catch (err) {
      console.error(err);
      setError("Verbindung zur Datenbank nicht möglich.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-neutral-100 px-4 py-8 pt-25 md:py-28 md:pt-40">
      <section className="w-full max-w-3xl rounded-3xl bg-white px-6 py-8 shadow-xl mc:px-12 md:-10">
        <header className="mb-8 text-center sm:text:left">
          <h1 className="text-2xl font-bold text-green-700">
            Benutzerverwaltung – neuen User anlegen
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            Hier können Administratoren neue Benutzer anlegen. Das
            Standard-Passwort für die Erst-Anmeldung ist{" "}
            <span className="font-semibold whitespace-nowrap">"Raum123!"</span> und es wird als
            Hash gespeichert.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="benutzer@fh-joanneum.at"
              pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$" /*"^[^@\s]+@[^@\s]+\.[^@\s]+$"*/
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-base outline-none focus:border-green-800 sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Benutzername
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-base outline-none focus:border-green-800 sm:text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Vorname
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Vorname"
                className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-base outline-none focus:border-green-800 sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Nachname
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nachname"
                className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-base outline-none focus:border-green-800 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Rolle
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-base outline-none focus:border-green-800 sm:text-sm"
            >
              <option value="1">Admin</option>
              <option value="2">User</option>
            </select>
          </div>

          {error && (
            <p className="text-center text-sm font-medium text-red-600">{error}</p>
          )}
          {success && !error && (
            <p className="text-center text-sm font-medium text-green-700">{success}</p>
          )}

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center rounded-full bg-green-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70 sm:w-auto"
            >
              {loading ? "Wird angelegt..." : "Benutzer anlegen"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
