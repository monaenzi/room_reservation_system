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

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || "Raum123!";

export async function GET(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    conn = await pool.getConnection();

    const users = await conn.query(`
      SELECT
        u.user_id as id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number as phone,
        u.role_id,
        r.role_name
      FROM users u
      LEFT JOIN role r ON u.role_id = r.role_id
    `);

    return NextResponse.json(
      {
        users: users,
        total: users.length
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}




export async function POST(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const { email, username, first_name, last_name, role_id } = await req.json();

    if (!email || !username || !first_name || !last_name || !role_id) {
      return NextResponse.json(
        { message: "Alle Felder sind erforderlich." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    try {
      conn = await pool.getConnection();
    } catch (err) {
      console.error("DB-Verbindung fehlgeschlagen:", err);
      return NextResponse.json(
        { message: "Verbindung zur Datenbank nicht möglich." },
        { status: 500 }
      );
    }

    try {
      const result = await conn.query(
        `INSERT INTO users (
          role_id, username, password_hash, first_name, last_name, email,
          account_deactivated, first_login
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
        [role_id, username, passwordHash, first_name, last_name, email]
      );

      return NextResponse.json(
        {
          message: "User erfolgreich angelegt.",
          user_id: Number(result.insertId),
          defaultPassword: DEFAULT_PASSWORD
        },
        { status: 201 }
      );
    } catch (err: any) {
      console.error("Fehler beim Insert:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { message: "Benutzername oder E-Mail bereits vergeben." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: "Fehler beim Anlegen des Users." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Fehler im Admin-User-Endpoint:", err);
    return NextResponse.json(
      { message: "Interner Serverfehler." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
