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

  const [showCreateSection, setShowCreateSection] = useState(true);

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

  // für user bearbeitungs pupup
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleId, setEditRoleId] = useState("");




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





  // funktion um bearbeitungs popup zu öffnen
 function handleUserClick(user: User) {
    setSelectedUser(user);
    // Formular mit Benutzerdaten befüllen
    setEditFirstName(user.first_name);
    setEditLastName(user.last_name);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditRoleId(user.role_id.toString());
    setShowEditPopup(true);
  }

//  um Bearbeitung zu speichern
function handleSaveEdit() {
  if (!selectedUser) return;
  
  setEditLoading(true);
  
  // Kurze Verzögerung 
  setTimeout(() => {
    // Lokal aktualisieren
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? {
            ...user,
            first_name: editFirstName,
            last_name: editLastName,
            username: editUsername,
            email: editEmail,
            phone: editPhone,
            role_id: Number(editRoleId),
            role_name: Number(editRoleId) === 1 ? "Admin" : "User"
          }
        : user
    ));
    
    setSuccess(`Benutzer ${editFirstName} ${editLastName} erfolgreich aktualisiert.`);
    setShowEditPopup(false);
    setEditLoading(false);
  }, 300); // für bessere UX
}

// Formular zurückzusetzen
function handleResetEdit() {
  if (selectedUser) {
    setEditFirstName(selectedUser.first_name);
    setEditLastName(selectedUser.last_name);
    setEditUsername(selectedUser.username);
    setEditEmail(selectedUser.email);
    setEditPhone(selectedUser.phone || "");
    setEditRoleId(selectedUser.role_id.toString());
  }
}

// Popup zu schließen
function handleClosePopup() {
  setShowEditPopup(false);
  setSelectedUser(null);
}


function handleDeleteUser(id: number, event: React.MouseEvent){
  event.stopPropagation();

  if(!confirm("Möchten Sie diesen User wirklich löschen?")) return;

  setUsers(users.filter(user => user.id !== id));
  setSuccess("User erfolgreich gelöscht");

  if (selectedUser && selectedUser.id === id){
    setShowEditPopup(false);
    setSelectedUser(null);
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
            className="mb-6 flex w-full items-center justify-between rounded-xl border-2 border-green-700 bg-green-50 px-6 py-4 text-left hover:bg-green-100"
          >
            <h2 className="text-xl font-bold text-green-700">
              User erstellen
            </h2>
            <svg
              className={`h-6 w-6 transform transition-transform ${
                showCreateSection ? "rotate-180" : ""
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
        </div>
        )}
      </div>
 

          {/* collapsible section für benutzerbearbeitung */}
        <div className="border-t border-neutral-200 pt-10">
          <button onClick={() => setShowEditSection(!showEditSection)}
            className="mb-6 flex w-full items-center justify-between rounded-xl border-2 border-green-700 bg-green-50 px-6 py-4 text-left hover:bg-green-100">
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
            <div className="rounded-xl border-2 border-green-700 bg-green-50 p-4 sm:p-6">
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
                    <tr key={user.id}
                    className="border-b border-green-200 hover:bg-green-100/50 cursor-pointer"
                    onClick={() => handleUserClick(user)}>
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
                      <td className="px-4 py-3">
                        <button onClick={(e) => handleDeleteUser(user.id, e)}
                          className="text-red-600 hover:text-red-800 transition-color"
                          title="User löschen">
                            <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                              <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
              <h2 className="text-xl font-bold text-green-700">
                User bearbeiten
              </h2>
              <button
                onClick={handleClosePopup}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bearbeitungsformular */}
            <div className="space-y-6">
              {/* Vorname & Nachname in einer Zeile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                    Vorname
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                    Nachname
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                  />
                </div>
              </div>


              {/* Username mit Passwort-Hinweis */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                />  
              </div>


               {/* E-Mail */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                />
              </div>



              {/* Telefonnummer */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="z.B. 0664/1234567"
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                />
              </div>


              {/* Rolle */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-700">
                  Rolle
                </label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full rounded-xl border-2 border-green-700 bg-green-100 px-4 py-3 text-sm outline-none focus:border-green-800"
                >
                  <option value="1">Admin</option>
                  <option value="2">User</option>
                </select>
              </div>


             {/* Fehler/Success Meldungen */}
              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}
              {success && !error && (
                <p className="text-center text-sm text-green-700">{success}</p>
              )}

              {/* Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleResetEdit}
                  className="rounded-full border-2 border-green-700 bg-white px-6 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  Zurücksetzen
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-700/70"
                >
                  {editLoading ? "Wird gespeichert..." : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
