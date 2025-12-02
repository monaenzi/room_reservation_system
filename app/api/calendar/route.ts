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

// Typ für Timeslot
type Timeslot = {
  timeslot_id: number;
  room_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  timeslot_status: number;
};

// Typ für Insert-Ergebnis
type InsertResult = {
  insertId: number;
  affectedRows?: number;
  warningStatus?: number;
};

export async function POST(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const { user_id, room_id, slot_date, start_time, end_time, reason } = await req.json();

    if (!user_id || !room_id || !slot_date || !start_time || !end_time || !reason) {
      return NextResponse.json(
        { message: "Alle Felder (User, Raum, Datum, Start, Ende, Grund) sind erforderlich." },
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

    // Prüfen, ob Timeslot schon existiert
    const existing: Timeslot[] = await conn.query(
      "SELECT * FROM timeslot WHERE room_id=? AND slot_date=? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))",
      [room_id, slot_date, end_time, end_time, start_time, start_time]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: "Dieser Zeitraum ist bereits reserviert oder kann nicht gebucht werden." }, { status: 409 });
    }
  } finally {
    if (conn) conn.release();
  }
}