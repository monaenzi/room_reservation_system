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

type Timeslot = {
  timeslot_id: number;
  room_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  timeslot_status: number;
};

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

    // Datum normalisieren (nur YYYY-MM-DD)
    const normalizedDate = slot_date.split("T")[0];

    // Prüfen, ob Timeslot schon existiert
    const existing: Timeslot[] = await conn.query(
      "SELECT * FROM timeslot WHERE room_id=? AND slot_date=? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))",
      [room_id, normalizedDate, end_time, end_time, start_time, start_time]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: "Dieser Zeitraum ist bereits reserviert oder kann nicht gebucht werden." }, { status: 409 });
    }

    // Timeslot erstellen (status = 2 → reserviert)
    const timeslotResult: InsertResult = await conn.query(
      "INSERT INTO timeslot (room_id, slot_date, start_time, end_time, timeslot_status) VALUES (?, ?, ?, ?, 2)",
      [room_id, normalizedDate, start_time, end_time]
    );
    const timeslot_id = timeslotResult.insertId;
    if (!timeslot_id) throw new Error("timeslot_id konnte nicht ermittelt werden.");

    // Booking erstellen
    const bookingResult: InsertResult = await conn.query(
      "INSERT INTO booking (user_id, timeslot_id, reason, booking_status) VALUES (?, ?, ?, 1)",
      [user_id, timeslot_id, reason]
    );
    const booking_id = bookingResult.insertId;
    if (!booking_id) throw new Error("booking_id konnte nicht ermittelt werden.");

    return NextResponse.json(
      { message: "Timeslot erfolgreich erstellt und reserviert.", timeslot_id, booking_id },
      { status: 200 }
    );

  } catch (err) {
    console.error("Fehler beim Erstellen von Timeslot & Booking:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function GET() {
  let conn: mariadb.PoolConnection | undefined;

  try {
    conn = await pool.getConnection();

    // Alle reservierten Timeslots abrufen
    const timeslots: (Timeslot & { user_id?: number; reason?: string })[] = await conn.query(
      "SELECT t.*, b.user_id, b.reason FROM timeslot t LEFT JOIN booking b ON t.timeslot_id = b.timeslot_id WHERE t.timeslot_status=2"
    );

    return NextResponse.json(timeslots);
  } catch (err) {
    console.error("Fehler beim Laden der Timeslots:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
