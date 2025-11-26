import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

export async function PUT(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const user_id = pathParts[pathParts.length - 1];

    const {first_name, last_name, email, phne_number, role, password} = await req.json();
    if(!first_name && !last_name && !email && !phne_number && !role && !password) {
        return NextResponse.json(
            {message: "mindestens ein Feld muss angegeben werden."},
            {status: 400}
        );
    }
    return NextResponse.json(
      { message: "validation passed", user_id, fields: {first_name, last_name, email, phne_number, role} },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unerwarteter Fehler:", err);
    return NextResponse.json(
      { message: "Interner Serverfehler." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}