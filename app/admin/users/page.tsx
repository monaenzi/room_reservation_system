"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from 'lucide-react';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  phone_number?: string;
  role_id: number;
  role_name?: string;
  role?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("0");
  const [loading, setLoading] = useState(false);

  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [editError, setEditError] = useState<String | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [showCreateSection, setShowCreateSection] = useState(true);
  const [showEditSection, setShowEditSection] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleId, setEditRoleId] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const storedRole = localStorage.getItem("userRole");

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (storedRole !== "admin") {
      router.push("/");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (showEditSection) {
      fetchUsers();
    }
  }, [showEditSection]);

  async function fetchUsers() {
    setLoadingUsers(true);
    setEditError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Fehler beim Laden der Benutzer");
      const data = await res.json();
      setUsers(data.users || data || []);
    } catch (err) {
      console.error(err);
      setEditError("Konnte Benutzerliste nicht laden");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

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
          setCreateError("Benutzername oder E-Mail ist bereits vergeben.");
        } else if (res.status === 500) {
          setCreateError("Fehler beim Anlegen des Users oder DB-Verbindung.");
        } else {
          setCreateError(data?.message || "Anfrage fehlgeschlagen.");
        }
        return;
      }

      setCreateSuccess(
        `User erfolgreich angelegt. Default-Passwort für Erstanmeldung: Raum123!`
      );

      await fetchUsers();

      setEmail("");
      setUsername("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      console.error(err);
      setCreateError("Verbindung zur Datenbank nicht möglich.");
    } finally {
      setLoading(false);
    }
  }

  function handleUserClick(user: User) {
    setEditError(null);
    setEditSuccess(null);

    setSelectedUser(user);
    setEditFirstName(user.first_name);
    setEditLastName(user.last_name);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPhone(user.phone_number || user.phone || "");
    setEditRoleId(user.role_id.toString());
    setShowEditPopup(true);
  }

  async function handleSaveEdit() {
    if (!selectedUser) return;

    if (!editFirstName || editFirstName.trim() === "") {
      setEditError("Vorname darf nicht leer sein.");
      return;
    }

    if (!editLastName || editLastName.trim() === "") {
      setEditError("Nachname darf nicht leer sein.");
      return;
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!editEmail || !emailRegex.test(editEmail)) {
      setEditError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }

    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const roleToSend = editRoleId === "1" ? "admin" : "user";
      const userIdToUpdate = selectedUser.id;

      const res = await fetch(`/api/admin/users/${userIdToUpdate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          phone_number: editPhone || null,
          role: roleToSend,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: "Antwort war kein gültiges JSON", raw: text };
      }

      if (!res.ok) {
        if (res.status === 409) {
          setEditError(data?.message || "Benutzername oder E-Mail bereits vergeben.");
        } else if (res.status === 404) {
          setEditError("Benutzer nicht gefunden. Bitte prüfen Sie, ob die gesendete ID korrekt ist.");
        } else if (res.status === 400) {
          setEditError("Ungültige Eingabedaten");
        } else if (res.status === 500) {
          setEditError("Serverfehler beim Aktualisieren");
        } else {
          setEditError(data?.message || `Fehler beim Speichern (Status: " ${res.status})`);
        }
        return;
      }

      setEditSuccess(data.message || "Benutzer erfolgreich aktualisiert");
      setShowEditPopup(false);
      await fetchUsers();
    } catch (err) {
      console.error("Error in handleSaveEdit:", err);
      setEditError("Verbindung zum Server nicht möglich");
    } finally {
      setEditLoading(false);
    }
  }

  function handleResetEdit() {
    if (selectedUser) {
      setEditFirstName(selectedUser.first_name);
      setEditLastName(selectedUser.last_name);
      setEditUsername(selectedUser.username);
      setEditEmail(selectedUser.email);
      setEditPhone(selectedUser.phone_number || selectedUser.phone || "");
      setEditRoleId(selectedUser.role_id.toString());
    }
  }

  function handleClosePopup() {
    setShowEditPopup(false);
    setSelectedUser(null);
    setEditError(null);
    setEditSuccess(null);
  }

  async function handleDeleteUser(user_id: number, event: React.MouseEvent) {
    event.stopPropagation();

    if (!confirm("Möchten Sie diesen User wirklich löschen?")) return;

    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${user_id}`, { method: "DELETE" });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: "Antwort war kein gültiges JSON", raw: text };
      }

      if (!res.ok) {
        if (res.status === 404) {
          setEditError("Benutzer nicht gefunden.");
        } else if (res.status === 500) {
          setEditError("Serverfehler beim Löschen.");
        } else {
          setEditError(data?.message || "Fehler beim Löschen.");
        }
        return;
      }

      setEditSuccess(data.message || "User erfolgreich gelöscht");
      await fetchUsers();

      if (selectedUser && selectedUser.id === user_id) {
        setShowEditPopup(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
      setEditError("Verbidung zum Server nicht möglich");
    } finally {
      setEditLoading(false);
    }
  }

  async function confirmDelete() {
    if (!userToDelete) return;

    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: "Antwort war kein gültiges JSON", raw: text };
      }

      if (!res.ok) {
        if (res.status === 404) {
          setEditError("Benutzer nicht gefunden");
        } else if (res.status === 500) {
          setEditError("Serverfehler beim Löschen");
        } else {
          setEditError(data?.message || "Fehelr beim Löschen");
        }
        return;
      }

      setEditSuccess(data.message || "User erfolgreich gelöscht");
      await fetchUsers();

      if (selectedUser && selectedUser.id === userToDelete.id) {
        setShowEditPopup(false);
        setSelectedUser(null);
      }
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      setEditError("Verbindung zum Server nicht möglich");
    } finally {
      setEditLoading(false);
    }
  }

  function cancelDelete() {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
    setEditError(null);
    setEditSuccess(null);
  }

  async function handleResetPassword() {
    if (!selectedUser) return;
    if (!confirm(`Passwort für "${selectedUser.username}" auf "Raum123!" zurücksetzen?`)) return;

    setResetLoading(true);
    setResetSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_password: true }),
      });

      if (res.ok) {
        setResetSuccess("Passwort wurde zurückgesetzt.");
      } else {
        alert("Fehler beim Zurücksetzen.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-neutral-100 px-3 pt-8 pt-24 pb-10 md:px-6 md:pt-32">
      <section className="w-full max-w-4xl rounded-3xl bg-white px-4 py-6 shadow-xl sm:px-8 sm:py-10">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">
            Userverwaltung
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            Hier können Administratoren neue User erstellen und bearbeiten. Das
            Standard-Passwort für die Erst-Anmeldung ist{" "}
            <span className="font-semibold whitespace-nowrap">"Raum123!"</span> und es wird als
            Hash gespeichert.
          </p>
        </header>

        <div className="mb-10">
          <button
            onClick={() => setShowCreateSection(!showCreateSection)}
            className="mb-6 flex w-full items-center justify-between rounded-xl border-2 border-green-700 bg-green-50 px-6 py-4 text-left hover:bg-green-100 cursor-pointer"
          >
            <h2 className="text-xl font-bold text-green-700">
              User erstellen
            </h2>
            <svg
              className={`h-6 w-6 transform transition-transform ${showCreateSection ? "rotate-180" : ""
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

          {showCreateSection && (
            <div className="rounded-xl border-2 border-green-700 bg-green-50 p-6">
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
                    pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
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
                    className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-base outline-none focus:border-green-800 sm:text-sm cursor-pointer"
                  >
                    <option value="1">Admin</option>
                    <option value="2">User</option>
                  </select>
                </div>

                {createError && (
                  <p className="text-center text-sm font-medium text-red-600">{createError}</p>
                )}
                {createSuccess && !createError && (
                  <p className="text-center text-sm font-medium text-green-700">{createSuccess}</p>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full justify-center rounded-full bg-green-700 px-10 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70 sm:w-auto cursor-pointer"
                  >
                    {loading ? "Wird angelegt..." : "Benutzer anlegen"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-10">
          <button
            onClick={() => {
              setShowEditSection(!showEditSection);
              setEditError(null);
              setEditSuccess(null);
            }}
            className="mb-6 flex w-full items-center justify-between rounded-xl border-2 border-green-700 bg-green-50 px-6 py-4 text-left hover:bg-green-100 cursor-pointer"
          >
            <h2 className="text-xl font-bold text-green-700">User bearbeiten</h2>

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
              {editError && !showEditPopup && (
                <p className="mb-4 text-center text-sm font-medium text-red-600">{editError}</p>
              )}
              {editSuccess && !showEditPopup && !editError && (
                <p className="mb-4 text-center text-sm font-medium text-green-700">{editSuccess}</p>
              )}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700">Löschen</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={`${user.id}-${user.username}`}
                        className="border-b border-green-200 hover:bg-green-100/50 cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="px-4 py-3 text-sm text-neutral-700">{user.first_name}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{user.last_name}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">
                          <span className="font-mono">**********</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-neutral-700">{user.phone_number || user.phone || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${user.role_id === 1 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {user.role_name || user.role || (user.role_id === 1 ? "Admin" : "User")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-800 transition-color cursor-pointer"
                            title="User löschen"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
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

      {showEditPopup && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-green-700">User bearbeiten</h2>
              <button onClick={handleClosePopup} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">Vorname</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">Nachname</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  readOnly
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-neutral-500">Username kann nicht geändert werden</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">E-Mail</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
                  title="Bitte eine E-Mail-Adresse in einem gültigem Format eingeben."
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800 invalid:border-red-500 invalid:text-red-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">Telefonnummer</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="z.B. 0664/1234567"
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">Rolle</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800 cursor-pointer"
                >
                  <option value="1">Admin</option>
                  <option value="2">User</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="w-full rounded-xl border-2 border-red-300 bg-red-100 py-2 text-sm font-medium text-red-500 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  {resetLoading ? "..." : "Passwort zurücksetzen"}
                </button>
                <p className="mt-1 text-center text-xs font-semibold text-green-600">
                  {resetSuccess}
                </p>
              </div>

              {editError && <p className="text-center text-sm text-red-600">{editError}</p>}
              {editSuccess && !editError && <p className="text-center text-sm text-green-700">{editSuccess}</p>}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="rounded-full border-2 border-green-700 bg-white px-6 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70 cursor-pointer"
                >
                  {editLoading ? "Wird gespeichert..." : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm scale-100 rounded-3xl bg-white p-8 shadow-2xl sm_p-6">
            <div className="mb-1">
              <h2 className="text-center text-3xl font-bold text-red-700">User löschen</h2>
              <button onClick={cancelDelete} className="text-neutral-400 hover:text-neutral-600">
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-center">
                <TriangleAlert
                  className="mx-auto h-20 w-20 text-red-500"
                  strokeWidth={2}
                />
                <h3 className="mt-1 text-lg font-semibold text-neutral-800">Möchten Sie diesen User wirklich löschen?</h3>

                <p className="mt-2 text-neutral-600">
                  <span className="font-semibold">{userToDelete.first_name} {userToDelete.last_name}</span>
                  <br />
                  ({userToDelete.email})
                </p>
              </div>

              {editError && <p className="text-center text-sm text-red-600">{editError}</p>}
              {editSuccess && !editError && <p className="text-center text-sm text-green-700">{editSuccess}</p>}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="rounded-full border-2 border-green-700 bg-white px-6 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={editLoading}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-600/70"
                >
                  {editLoading ? "Wird gelöscht..." : "Ja, löschen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}