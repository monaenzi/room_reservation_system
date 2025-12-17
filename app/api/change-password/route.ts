import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";
import bcrypt from "bcryptjs";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

export async function POST(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const { email, oldPassword, newPassword } = await req.json();

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "E-Mail, aktuelles und neues Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    const rows = await conn.query(
      "SELECT user_id, password_hash, first_login, account_deactivated FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: "Ungültige Zugangsdaten." }, { status: 401 });
    }

    const user = rows[0];

    if (user.account_deactivated) {
      return NextResponse.json({ message: "Dieser Account ist deaktiviert." }, { status: 403 });
    }

    const passwordOk = await bcrypt.compare(oldPassword, user.password_hash as string);
    if (!passwordOk) {
      return NextResponse.json({ message: "Ungültige Zugangsdaten." }, { status: 401 });
    }

    const same = await bcrypt.compare(newPassword, user.password_hash as string);
    if (same) {
      return NextResponse.json(
        { message: "Das neue Passwort darf nicht mit dem alten identisch sein." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await conn.query(
      "UPDATE users SET password_hash = ?, first_login = 1 WHERE user_id = ?",
      [newHash, user.user_id]
    );

    const res = NextResponse.json({ message: "Passwort erfolgreich geändert." }, { status: 200 });

    res.cookies.set("must_change_password", "0", { httpOnly: true, sameSite: "lax", path: "/" });

    return res;
  } catch (err) {
    console.error("Fehler im change-password-Endpoint:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}