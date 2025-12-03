"use client";

import { FormEvent, useState } from "react";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  role_id: number;
  role_name?: string;
}

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showEditSection, setShowEditSection] = useState(false); //für Collapsible Panel


  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      first_name: "Alia",
      last_name: "Alamer",
      username: "a.alamer",
      email: "alia.alamer@gmail.com",
      phone: "0664/1234567",
      role_id: 1,
      role_name: "Admin"
    },
    {
      id: 2,
      first_name: "Ramona",
      last_name: "Enzi",
      username: "r.enzi",
      email: "enzi.ramona@gmail.com",
      phone: "0664/6543211",
      role_id: 1,
      role_name: "Admin"
    },
    {
      id: 3,
      first_name: "Linda",
      last_name: "Kadyrova",
      username: "l.kady",
      email: "k.linda@gmail.com",
      phone: "0660/4567890",
      role_id: 2,
      role_name: "User"
    },
    {
      id: 4,
      first_name: "Lucas",
      last_name: "Wychodii-Lubi",
      username: "l.wycho",
      email: "l.wycho@gmail.com",
      phone: "0670/135792",
      role_id: 2,
      role_name: "User"
    }
  ]);


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
    <main className="flex justify-center bg-neutral-100 py-28">
      <section className="w-full max-w-3xl rounded-3xl bg-white px-8 py-10 shadow-xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-green-700">
            Benutzerverwaltung – neuen User anlegen
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            Hier können Administratoren neue Benutzer anlegen. Das
            Standard-Passwort für die Erst-Anmeldung ist{" "}
            <span className="font-semibold">"Raum123!"</span> und es wird als
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
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
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
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
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
                className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
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
                className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
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
              className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
            >
              <option value="1">Admin</option>
              <option value="2">User</option>
            </select>
          </div>

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          {success && !error && (
            <p className="text-center text-sm text-green-700">{success}</p>
          )}

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[200px] justify-center rounded-full bg-green-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70"
            >
              {loading ? "Wird angelegt..." : "Benutzer anlegen"}
            </button>
          </div>
        </form>



          {/* collapsible section für benutzerbearbeitung */}
        <div className="border-t border-neutral-200 pt-10">
          <button onClick={() => setShowEditSection(!showEditSection)}
            className="mb-6 flex w-full items-center justify-between rounded-xl border-2 border-green-700 bg-green-50 px-6 py-4 text-left hover:bg-green-100">
            <h2 className="text-xl font-bold text-green-700">Benutzer bearbeiten</h2>

            <svg
              className={`h-6 w-6 transform transition-transform ${showEditSection ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showEditSection && (
            <div className="rounded-xl border-2 border-green-700 bg-green-50 p-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-green-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Vorname</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Nachname</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Password</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">E-Mail</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Telefonnummer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Rolle</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                  {users.map((user) => (
                    <tr key={user.id}
                    className="border-b border-green-200 hover:bg-green-100/50">
                      <td className="px-4 py-3 text-sm text-neutral-700">{user.first_name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{user.last_name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        <span className="font-mono">**********</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{user.phone || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role_id === 1 
                              ? "bg-red-100 text-red-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>{user.role_name || (user.role_id === 1 ? "Admin" : "User")}</span>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-green-200 pt-4">
                <p className="text-sm text-neutral-600">Gesamt: {users.length} Benutzer</p>
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
