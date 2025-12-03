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

type InsertResult = {
  insertId: number;
};

// GET: Timeslots abfragen
export async function GET(req: NextRequest) {
  const room_id = req.nextUrl.searchParams.get("room_id");
  if (!room_id) {
    return NextResponse.json({ message: "room_id fehlt." }, { status: 400 });
  }

  let conn: mariadb.PoolConnection | undefined;
  try {
    conn = await pool.getConnection();
    const timeslots = await conn.query(
      "SELECT t.*, b.reason AS name, b.user_id FROM timeslot t LEFT JOIN booking b ON t.timeslot_id = b.timeslot_id WHERE t.room_id=?",
      [room_id]
    );
    return NextResponse.json(timeslots);
  } catch (err) {
    console.error("Fehler beim Laden der Timeslots:", err);
    return NextResponse.json({ message: "Fehler beim Laden der Timeslots." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// POST: Timeslot buchen
export async function POST(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const { user_id, room_id, slot_date, start_time, end_time, reason } = await req.json();

    if (!user_id || !room_id || !slot_date || !start_time || !end_time || !reason) {
      return NextResponse.json(
        { message: "Alle Felder sind erforderlich." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    // Datum normalisieren (YYYY-MM-DD)
    const normalizedDate = slot_date.split("T")[0];

    // Prüfen, ob dieser Zeitraum schon gebucht ist
    const existing = await conn.query(
      "SELECT * FROM timeslot WHERE room_id=? AND slot_date=? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))",
      [room_id, normalizedDate, end_time, end_time, start_time, start_time]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Dieser Zeitraum ist bereits gebucht." },
        { status: 409 }
      );
    }

    // Timeslot erstellen (status=2 → reserviert)
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
      {
        message: "Timeslot erfolgreich erstellt und gebucht.",
        timeslot_id: Number(timeslot_id),
        booking_id: Number(booking_id)
      },
      { status: 201 }
    );


  } catch (err) {
    console.error("Fehler bei User-Buchung:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
