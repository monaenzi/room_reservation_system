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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "E-Mail und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    try {
      conn = await pool.getConnection();
    } catch (err) {
      console.error("DB-Verbindung fehlgeschlagen:", err);
      return NextResponse.json(
        { message: "Verbindung zur Datenbank nicht möglich." },
        { status: 500 }
      );
    }

  
    const rows = await conn.query(
      "SELECT id, email, password FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
           return NextResponse.json(
        { message: "Ungültige Zugangsdaten." },
        { status: 401 }
      );
    }

    const user = rows[0];

    const passwordOk = await bcrypt.compare(
      password,
      user.password_hash as string
    );

    if (!passwordOk) {
      return NextResponse.json(
        { message: "Ungültige Zugangsdaten." },
        { status: 401 }
      );
    }

    
    return NextResponse.json(
      { message: "Login erfolgreich." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unerwarteter Fehler im Login-Endpoint:", err);
    return NextResponse.json(
      { message: "Interner Serverfehler." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
