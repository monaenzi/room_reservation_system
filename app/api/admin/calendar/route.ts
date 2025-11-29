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

// POST: Neue Reservierung erstellen
export async function POST(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;
  try {
    const { user_id, timeslot_id, reason } = await req.json();

    if (!user_id || !timeslot_id || !reason) {
      return NextResponse.json({ message: "Alle Felder sind erforderlich." }, { status: 400 });
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

    // Prüfen, ob Timeslot verfügbar ist
    const [slot] = await conn.query(
      "SELECT timeslot_status FROM timeslot WHERE timeslot_id = ?",
      [timeslot_id]
    );

    if (!slot || slot.timeslot_status !== 1) {
      return NextResponse.json({ message: "Timeslot nicht verfügbar." }, { status: 409 });
    }

    // Booking erstellen
    const result = await conn.query(
      "INSERT INTO booking (user_id, timeslot_id, reason) VALUES (?, ?, ?)",
      [user_id, timeslot_id, reason]
    );

    // Timeslot auf reserviert setzen
    await conn.query("UPDATE timeslot SET timeslot_status = 2 WHERE timeslot_id = ?", [timeslot_id]);

    return NextResponse.json({ message: "Reservierungsanfrage erstellt", booking_id: result.insertId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// GET: Buchungen abfragen (Admin oder Nutzer)
export async function GET(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // optional: pending, confirmed, declined
    const user_id = url.searchParams.get("user_id"); // optional: nur eigene Buchungen

 try {
      conn = await pool.getConnection();
    } catch (err) {
      console.error("DB-Verbindung fehlgeschlagen:", err);
      return NextResponse.json(
        { message: "Verbindung zur Datenbank nicht möglich." },
        { status: 500 }
      );
    }

    let query = "SELECT b.*, t.slot_date, t.start_time, t.end_time, r.room_name FROM booking b JOIN timeslot t ON b.timeslot_id = t.timeslot_id JOIN room r ON t.room_id = r.room_id";
    const params: any[] = [];

    if (status) {
      query += " WHERE b.booking_status = ?";
      params.push(status === "pending" ? 0 : status === "confirmed" ? 1 : 2);
      if (user_id) {
        query += " AND b.user_id = ?";
        params.push(user_id);
      }
    } else if (user_id) {
      query += " WHERE b.user_id = ?";
      params.push(user_id);
    }

    const bookings = await conn.query(query, params);

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Fehler beim Abrufen der Buchungen." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// PATCH: Admin akzeptiert oder lehnt Buchung
export async function PATCH(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;
  try {
    const { booking_id, action } = await req.json();
    if (!booking_id || !action) {
      return NextResponse.json({ message: "booking_id und action sind erforderlich." }, { status: 400 });
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
    
    // Prüfen ob Booking existiert
    const [booking] = await conn.query("SELECT * FROM booking WHERE booking_id = ?", [booking_id]);
    if (!booking) {
      return NextResponse.json({ message: "Buchung nicht gefunden." }, { status: 404 });
    }

    const timeslot_id = booking.timeslot_id;

    if (action === "approve") {
      // Booking auf bestätigt setzen
      await conn.query("UPDATE booking SET booking_status = 1, responded_at = CURRENT_TIMESTAMP WHERE booking_id = ?", [booking_id]);
      // Timeslot bleibt reserviert
    } else if (action === "decline") {
      // Booking auf abgelehnt setzen
      await conn.query("UPDATE booking SET booking_status = 2, responded_at = CURRENT_TIMESTAMP WHERE booking_id = ?", [booking_id]);
      // Timeslot wieder verfügbar machen
      await conn.query("UPDATE timeslot SET timeslot_status = 1 WHERE timeslot_id = ?", [timeslot_id]);
    } else {
      return NextResponse.json({ message: "Ungültige Aktion." }, { status: 400 });
    }

    return NextResponse.json({ message: `Buchung ${action}ed.` }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Fehler beim Aktualisieren der Buchung." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}


