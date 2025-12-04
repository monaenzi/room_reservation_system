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
  const action = req.nextUrl.searchParams.get("action");
  const user_id = req.nextUrl.searchParams.get("user_id");
  
  let conn: mariadb.PoolConnection | undefined;
  
  try {
    conn = await pool.getConnection();
    
    if (user_id) {
      const userBookings = await conn.query(`
        SELECT 
          b.booking_id,
          b.user_id,
          b.timeslot_id,
          b.reason,
          b.booking_status,
          t.room_id,
          t.slot_date,
          t.start_time,
          t.end_time,
          t.timeslot_status,
          r.room_name
        FROM booking b
        JOIN timeslot t ON b.timeslot_id = t.timeslot_id
        JOIN room r ON t.room_id = r.room_id
        WHERE b.user_id = ?
        ORDER BY t.slot_date DESC, t.start_time DESC
      `, [user_id]);
      return NextResponse.json(userBookings);
    }
    
    if (action === 'admin-requests') {
      const requests = await conn.query(`
        SELECT 
          b.booking_id,
          b.user_id,
          b.timeslot_id,
          b.reason,
          b.booking_status,
          t.room_id,
          t.slot_date,
          t.start_time,
          t.end_time,
          t.timeslot_status,
          u.username,
          r.room_name
        FROM booking b
        JOIN timeslot t ON b.timeslot_id = t.timeslot_id
        JOIN users u ON b.user_id = u.user_id
        JOIN room r ON t.room_id = r.room_id
        WHERE b.booking_status = 0
        ORDER BY t.slot_date, t.start_time
      `);
      return NextResponse.json(requests);
    }
    
    if (room_id) {
      const timeslots = await conn.query(
        `SELECT 
          t.*, 
          b.reason AS name, 
          b.user_id, 
          b.booking_status,
          r.room_name
        FROM timeslot t 
        LEFT JOIN booking b ON t.timeslot_id = b.timeslot_id
        LEFT JOIN room r ON t.room_id = r.room_id
        WHERE t.room_id = ?`,
        [room_id]
      );
      return NextResponse.json(timeslots);
    }
    
    return NextResponse.json({ message: "Parameter fehlen." }, { status: 400 });
    
  } catch (err) {
    console.error("Fehler beim Laden der Daten:", err);
    return NextResponse.json({ message: "Fehler beim Laden der Daten." }, { status: 500 });
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

    const normalizedDate = slot_date.split("T")[0];

    // Prüfen, ob dieser Zeitraum schon gebucht oder blockiert ist
    const existing = await conn.query(
      `SELECT * FROM timeslot 
       WHERE room_id = ? 
       AND slot_date = ? 
       AND start_time < ? 
       AND end_time > ? 
       AND timeslot_status IN (2, 3)`, // Nur reserved (2) oder blocked (3)
      [room_id, normalizedDate, end_time, start_time]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Dieser Zeitraum ist bereits belegt." },
        { status: 409 }
      );
    }

    // Timeslot erstellen (status=2 → reserved)
    const timeslotResult: InsertResult = await conn.query(
      "INSERT INTO timeslot (room_id, slot_date, start_time, end_time, timeslot_status) VALUES (?, ?, ?, ?, 2)",
      [room_id, normalizedDate, start_time, end_time]
    );
    const timeslot_id = timeslotResult.insertId;
    if (!timeslot_id) throw new Error("timeslot_id konnte nicht ermittelt werden.");

    // Booking erstellen (booking_status=0 → pending)
    const bookingResult: InsertResult = await conn.query(
      "INSERT INTO booking (user_id, timeslot_id, reason, booking_status) VALUES (?, ?, ?, 0)",
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

// PUT: Admin-Aktionen (Annehmen/Ablehnen)
export async function PUT(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;
  
  try {
    const { booking_id, action } = await req.json();
    
    if (!booking_id || !action) {
      return NextResponse.json(
        { message: "booking_id und action sind erforderlich." },
        { status: 400 }
      );
    }
    
    conn = await pool.getConnection();
    
    if (action === 'accept') {
      // Buchung akzeptieren: booking_status = 1 (confirmed), timeslot_status = 2 (reserved)
      await conn.query(`
        UPDATE booking b
        JOIN timeslot t ON b.timeslot_id = t.timeslot_id
        SET b.booking_status = 1, t.timeslot_status = 2
        WHERE b.booking_id = ?
      `, [booking_id]);
      
      return NextResponse.json({ 
        message: "Buchung akzeptiert.", 
        booking_id: Number(booking_id) 
      });
      
    } else if (action === 'reject') {
      // Timeslot-ID holen bevor buchung löschen
      const bookingInfo = await conn.query(
        `SELECT b.timeslot_id FROM booking b WHERE b.booking_id = ?`,
        [booking_id]
      );
      
      if (bookingInfo.length === 0) {
        return NextResponse.json(
          { message: "Buchung nicht gefunden." },
          { status: 404 }
        );
      }
      
      const timeslot_id = bookingInfo[0].timeslot_id;
      
      
      await conn.query(
        "DELETE FROM booking WHERE booking_id = ?",
        [booking_id]
      );
      
      await conn.query(
        "DELETE FROM timeslot WHERE timeslot_id = ?",
        [timeslot_id]
      );
      
      return NextResponse.json({ 
        message: "Buchung abgelehnt und Timeslot gelöscht.", 
        booking_id: Number(booking_id) 
      });
      
    } else {
      return NextResponse.json(
        { message: "Ungültige Aktion." },
        { status: 400 }
      );
    }
    
  } catch (err) {
    console.error("Fehler bei Admin-Aktion:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;
  
  try {
    const booking_id = req.nextUrl.searchParams.get("booking_id");
    
    if (!booking_id) {
      return NextResponse.json(
        { message: "booking_id ist erforderlich." },
        { status: 400 }
      );
    }
    
    conn = await pool.getConnection();
    
    // Timeslot-ID holen
    const bookingInfo = await conn.query(
      `SELECT b.timeslot_id FROM booking b WHERE b.booking_id = ?`,
      [booking_id]
    );
    
    if (bookingInfo.length === 0) {
      return NextResponse.json(
        { message: "Buchung nicht gefunden." },
        { status: 404 }
      );
    }
    
    const timeslot_id = bookingInfo[0].timeslot_id;
    
    await conn.query(
      "DELETE FROM booking WHERE booking_id = ?",
      [booking_id]
    );
    
    await conn.query(
      "DELETE FROM timeslot WHERE timeslot_id = ?",
      [timeslot_id]
    );
    
    return NextResponse.json({ 
      message: "Buchung und Timeslot gelöscht.", 
      booking_id: Number(booking_id) 
    });
    
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// Slot sperren (Admin)
export async function PATCH(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;
  
  try {
    const { room_id, slot_date, start_time, end_time, reason } = await req.json();
    
    if (!room_id || !slot_date || !start_time || !end_time) {
      return NextResponse.json(
        { message: "Raum, Datum, Start- und Endzeit sind erforderlich." },
        { status: 400 }
      );
    }
    
    conn = await pool.getConnection();
    
    const normalizedDate = slot_date.split("T")[0];
    
    // Prüfen, ob Zeitraum schon gebucht/blockiert ist
    const existing = await conn.query(
      `SELECT * FROM timeslot 
       WHERE room_id = ? 
       AND slot_date = ? 
       AND start_time < ? 
       AND end_time > ? 
       AND timeslot_status IN (1, 2, 3)`,
      [room_id, normalizedDate, end_time, start_time]
    );
    
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Dieser Zeitraum ist bereits belegt." },
        { status: 409 }
      );
    }
    
    // Blockierten Timeslot erstellen (status=3 → blocked)
    const result: InsertResult = await conn.query(
      "INSERT INTO timeslot (room_id, slot_date, start_time, end_time, timeslot_status, blocked_reason) VALUES (?, ?, ?, ?, 3, ?)",
      [room_id, normalizedDate, start_time, end_time, 3, reason || "Gesperrt durch Admin"]
    );
    
    return NextResponse.json({ 
      message: "Timeslot erfolgreich gesperrt.",
      timeslot_id: Number(result.insertId)
    }, { status: 201 });
    
  } catch (err) {
    console.error("Fehler beim Sperren:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}