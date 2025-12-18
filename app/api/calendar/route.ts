import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";

const RECURRING_BOOKING_MAX_YEARS = 2;

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

export async function GET(req: NextRequest) {
  const room_id = req.nextUrl.searchParams.get("room_id");
  const action = req.nextUrl.searchParams.get("action");
  const user_id = req.nextUrl.searchParams.get("user_id");
  const pattern_id = req.nextUrl.searchParams.get("pattern_id");

  let conn: mariadb.PoolConnection | undefined;

  try {
    conn = await pool.getConnection();

    if (user_id) {
      const userBookings = await conn.query(
        `
        SELECT 
          b.booking_id,
          b.user_id,
          b.timeslot_id,
          b.reason,
          b.booking_status,
          b.is_recurring,
          b.pattern_id,
          t.room_id,
          DATE_FORMAT(t.slot_date, '%Y-%m-%d') AS slot_date,
          t.start_time,
          t.end_time,
          t.timeslot_status,
          r.room_name,
          rp.end_date as until_date,
          rp.frequency
        FROM booking b
        JOIN timeslot t ON b.timeslot_id = t.timeslot_id
        JOIN room r ON t.room_id = r.room_id
        LEFT JOIN recurring_pattern rp ON b.pattern_id = rp.pattern_id
        WHERE b.user_id = ?
        ORDER BY t.slot_date DESC, t.start_time DESC
      `,
        [user_id]
      );
      return NextResponse.json(userBookings);
    }

    if (action === "admin-requests") {
      const requests = await conn.query(`
        SELECT 
          b.booking_id,
          b.user_id,
          b.timeslot_id,
          b.reason,
          b.booking_status,
          b.is_recurring,
          b.pattern_id,
          t.room_id,
          DATE_FORMAT(t.slot_date, '%Y-%m-%d') AS slot_date,
          t.start_time,
          t.end_time,
          t.timeslot_status,
          u.username,
          r.room_name,
          rp.end_date as until_date,
          rp.frequency
        FROM booking b
        JOIN timeslot t ON b.timeslot_id = t.timeslot_id
        JOIN users u ON b.user_id = u.user_id
        JOIN room r ON t.room_id = r.room_id
        LEFT JOIN recurring_pattern rp ON b.pattern_id = rp.pattern_id
        WHERE b.booking_status = 0
        ORDER BY t.slot_date, t.start_time
      `);
      return NextResponse.json(requests);
    }

    if (room_id) {
      const timeslots = await conn.query(
        `
        SELECT 
          t.timeslot_id,
          t.room_id,
          DATE_FORMAT(t.slot_date, '%Y-%m-%d') AS slot_date,
          t.start_time,
          t.end_time,
          t.timeslot_status,
          t.blocked_reason,
          b.reason AS name,
          b.user_id,
          b.booking_status,
          u.username,
          r.room_name
        FROM timeslot t
        LEFT JOIN booking b ON t.timeslot_id = b.timeslot_id
        LEFT JOIN users u ON b.user_id = u.user_id
        LEFT JOIN room r ON t.room_id = r.room_id
        WHERE t.room_id = ?
      `,
        [room_id]
      );

      return NextResponse.json(timeslots);
    }

    return NextResponse.json({ message: "Parameter fehlen." }, { status: 400 });
  } catch (err) {
    console.error("Fehler beim Laden der Daten:", err);
    return NextResponse.json(
      { message: "Fehler beim Laden der Daten." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const body = await req.json();

    const {
      user_id,
      room_id,
      slot_date,
      start_time,
      end_time,
      reason,
      is_recurring = false,
      frequency = 'daily',
      until_date = null
    } = body;

    if (!user_id || !room_id || !slot_date || !start_time || !end_time || !reason) {
      return NextResponse.json(
        { message: "Alle Felder sind erforderlich." },
        { status: 400 }
      );
    }

    if (is_recurring && !until_date) {
      return NextResponse.json(
        { message: "Bei wiederkehrenden Buchungen muss ein Enddatum angegeben werden." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    const userResult = await conn.query(
      "SELECT role_id FROM users WHERE user_id = ?",
      [user_id]
    );

    const isAdmin = userResult[0]?.role_id === 1;
    const bookingStatus = isAdmin ? 1 : 0;

    const normalizedDate =
      typeof slot_date === "string" && slot_date.includes("T")
        ? slot_date.split("T")[0]
        : slot_date;

    const canBook = await conn.query(
      `
      SELECT 
        TIMESTAMP(?, ?) >= NOW() AS ok
    `,
      [normalizedDate, start_time]
    );

    if (!canBook?.[0]?.ok) {
      return NextResponse.json(
        { message: "Man kann keinen Raum in der Vergangenheit buchen." },
        { status: 400 }
      );
    }

    await conn.query(
      `
      UPDATE booking b
      JOIN timeslot t ON b.timeslot_id = t.timeslot_id
      SET b.booking_status = 1
      WHERE b.booking_status = 0
        AND TIMESTAMP(t.slot_date, t.start_time) < NOW()
    `
    );

    // VERBESSERTE PRÜFUNG FÜR ÜBERLAPPUNGEN (als separate Funktion)
    const checkOverlap = async (date: string, connection: mariadb.PoolConnection) => {
      const existing = await connection.query(
        `SELECT * FROM timeslot 
         WHERE room_id = ? 
           AND slot_date = ? 
           AND (
             (start_time < ? AND end_time > ?) OR
             (start_time >= ? AND start_time < ?) OR
             (end_time > ? AND end_time <= ?)
           )
           AND timeslot_status IN (2, 3)`,
        [
          room_id, date,
          end_time, start_time,
          start_time, end_time,
          start_time, end_time
        ]
      );
      return existing.length > 0;
    };

    if (is_recurring) {
      // ZUERST: Generiere alle Daten
      const generatedDates = generateRecurringDates(
        normalizedDate,
        until_date,
        frequency,
        RECURRING_BOOKING_MAX_YEARS
      );

      // PRÜFE ALLE DATEN AUF KONFLIKTE
      const conflictingDates: string[] = [];

      for (const date of generatedDates) {
        const hasConflict = await checkOverlap(date, conn);
        if (hasConflict) {
          conflictingDates.push(date);
        }
      }

      // WENN ES KONFLIKTE GIBT: ABBRECHEN
      if (conflictingDates.length > 0) {
        const conflictList = conflictingDates
          .slice(0, 5)
          .map(d => new Date(d).toLocaleDateString('de-DE'))
          .join(', ');

        const additional = conflictingDates.length > 5 ? ` und ${conflictingDates.length - 5} weitere` : '';

        return NextResponse.json(
          {
            message: `Es gibt Konflikte mit bestehenden Buchungen an folgenden Tagen: ${conflictList}${additional}. 
                      Die gesamte wiederkehrende Buchung wurde abgebrochen.`
          },
          { status: 409 }
        );
      }

      // WENN KEINE KONFLIKTE: Pattern erstellen
      const patternResult: any = await conn.query(
        "INSERT INTO recurring_pattern (frequency, start_date, end_date, until_date) VALUES (?, ?, ?, ?)",
        [frequency, normalizedDate, until_date, until_date]
      );

      const pattern_id = Number(patternResult.insertId);

      const bookings = [];
      let successfulBookings = 0;

      // Transaktion für alle Buchungen
      try {
        await conn.query("START TRANSACTION");

        for (const date of generatedDates) {
          const timeslotResult: any = await conn.query(
            "INSERT INTO timeslot (room_id, slot_date, start_time, end_time, timeslot_status) VALUES (?, ?, ?, ?, 2)",
            [room_id, date, start_time, end_time]
          );

          const timeslot_id = Number(timeslotResult.insertId);

          const bookingResult: any = await conn.query(
            "INSERT INTO booking (user_id, timeslot_id, reason, booking_status, is_recurring, pattern_id) VALUES (?, ?, ?, ?, ?, ?)",
            [user_id, timeslot_id, reason, bookingStatus, 1, pattern_id]
          );

          successfulBookings++;
          bookings.push({
            date,
            timeslot_id: Number(timeslotResult.insertId),
            booking_id: Number(bookingResult.insertId)
          });
        }

        await conn.query("COMMIT");
      } catch (error) {
        await conn.query("ROLLBACK");
        console.error("Fehler beim Erstellen der wiederkehrenden Buchungen:", error);

        // Pattern löschen, da Buchungen fehlgeschlagen sind
        await conn.query("DELETE FROM recurring_pattern WHERE pattern_id = ?", [pattern_id]);

        return NextResponse.json(
          { message: "Fehler beim Erstellen der wiederkehrenden Buchungen. Bitte versuchen Sie es erneut." },
          { status: 500 }
        );
      }

      const safeBookings = bookings.map(booking => ({
        ...booking,
        timeslot_id: Number(booking.timeslot_id),
        booking_id: Number(booking.booking_id)
      }));

      return NextResponse.json(
        {
          message: "Wiederkehrende Buchung erfolgreich erstellt.",
          bookings_count: successfulBookings,
          is_recurring: true,
          pattern_id: pattern_id,
          booking_status: bookingStatus,
          frequency: frequency,
          bookings: safeBookings
        },
        { status: 201 }
      );
    }

    // FÜR EINZELNE BUCHUNG: Prüfen auf Überlappung
    const hasConflict = await checkOverlap(normalizedDate, conn);
    if (hasConflict) {
      const existing = await conn.query(
        `SELECT * FROM timeslot 
         WHERE room_id = ? 
           AND slot_date = ? 
           AND timeslot_status IN (2, 3)`,
        [room_id, normalizedDate]
      );

      const conflictInfo = existing[0];
      const conflictTime = conflictInfo ?
        `${conflictInfo.start_time.substring(0, 5)}-${conflictInfo.end_time.substring(0, 5)}` : '';
      const conflictReason = conflictInfo?.blocked_reason || conflictInfo?.reason || 'Belegt';

      return NextResponse.json(
        {
          message: `Dieser Zeitraum ist bereits belegt ${conflictTime ? `(${conflictTime}: ${conflictReason})` : ''}.`
        },
        { status: 409 }
      );
    }

    const timeslotResult: any = await conn.query(
      "INSERT INTO timeslot (room_id, slot_date, start_time, end_time, timeslot_status) VALUES (?, ?, ?, ?, 2)",
      [room_id, normalizedDate, start_time, end_time]
    );

    const timeslot_id = Number(timeslotResult.insertId);
    if (!timeslot_id) throw new Error("timeslot_id konnte nicht ermittelt werden.");

    const bookingResult: any = await conn.query(
      "INSERT INTO booking (user_id, timeslot_id, reason, booking_status, is_recurring) VALUES (?, ?, ?, ?, ?)",
      [user_id, timeslot_id, reason, bookingStatus, 0]
    );

    const booking_id = Number(bookingResult.insertId);
    if (!booking_id) throw new Error("booking_id konnte nicht ermittelt werden.");

    return NextResponse.json(
      {
        message: isAdmin
          ? "Buchung erfolgreich erstellt und sofort bestätigt (Admin)."
          : "Buchung erfolgreich erstellt und zur Bestätigung vorgelegt.",
        timeslot_id: Number(timeslot_id),
        booking_id: Number(booking_id),
        booking_status: bookingStatus,
        is_recurring: false,
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

function generateRecurringDates(startDate: string, untilDate: string, frequency: 'daily' | 'weekly', maxYears: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const until = new Date(untilDate);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);
  const effectiveUntil = until < maxDate ? until : maxDate;

  let currentDate = new Date(start);

  while (currentDate <= effectiveUntil) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sonntag, 6 = Samstag

    // Überspringe Wochenenden (nur Montag-Freitag)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }

    if (frequency === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }

  return dates;
}

export async function PUT(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const body = await req.json();
    const { action, booking_id, booking_ids, pattern_id, end_date } = body;

    if (!action) {
      return NextResponse.json(
        { message: "action ist erforderlich." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    // 🔹 Vergangene PENDING-Buchungen automatisch auf bestätigt setzen
    await conn.query(`
      UPDATE booking b
      JOIN timeslot t ON b.timeslot_id = t.timeslot_id
      SET b.booking_status = 1
      WHERE b.booking_status = 0
        AND TIMESTAMP(t.slot_date, t.start_time) < NOW()
    `);

    /* ==========================================================
       ✅ ACCEPT
    ========================================================== */
    if (action === "accept") {

      // ===== Serienbuchung =====
      if (pattern_id) {
        const [row] = await conn.query(
          `
          SELECT MIN(TIMESTAMP(t.slot_date, t.start_time)) AS earliest_start
          FROM booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          WHERE b.pattern_id = ?
            AND b.booking_status = 0
        `,
          [pattern_id]
        );

        if (!row?.earliest_start) {
          return NextResponse.json(
            { message: "Keine ausstehenden Buchungen für diese Serie gefunden." },
            { status: 404 }
          );
        }

        if (new Date(row.earliest_start).getTime() < Date.now()) {
          return NextResponse.json(
            { message: "Vergangene Buchungen können nicht angenommen werden." },
            { status: 400 }
          );
        }

        await conn.query(
          `
          UPDATE booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          SET b.booking_status = 1,
              t.timeslot_status = 2
          WHERE b.pattern_id = ?
            AND b.booking_status = 0
        `,
          [pattern_id]
        );

        return NextResponse.json({ message: "Serie angenommen." });
      }

      // ===== Mehrere Einzelbuchungen =====
      if (Array.isArray(booking_ids) && booking_ids.length > 0) {
        await conn.query(
          `
          UPDATE booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          SET b.booking_status = 1,
              t.timeslot_status = 2
          WHERE b.booking_id IN (?)
        `,
          [booking_ids]
        );

        return NextResponse.json({ message: "Buchungen angenommen." });
      }

      // ===== Einzelbuchung =====
      if (booking_id) {
        const [row] = await conn.query(
          `
          SELECT TIMESTAMP(t.slot_date, t.start_time) AS start_time
          FROM booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          WHERE b.booking_id = ?
        `,
          [booking_id]
        );

        if (!row) {
          return NextResponse.json({ message: "Buchung nicht gefunden." }, { status: 404 });
        }

        if (new Date(row.start_time).getTime() < Date.now()) {
          return NextResponse.json(
            { message: "Vergangene Buchungen können nicht angenommen werden." },
            { status: 400 }
          );
        }

        await conn.query(
          `
          UPDATE booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          SET b.booking_status = 1,
              t.timeslot_status = 2
          WHERE b.booking_id = ?
        `,
          [booking_id]
        );

        return NextResponse.json({ message: "Buchung angenommen." });
      }
    }

    /* ==========================================================
       ❌ REJECT
    ========================================================== */
    if (action === "reject") {

      // ===== Serienbuchung =====
      if (pattern_id) {
        await conn.query(
          `
          DELETE b, t
          FROM booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          WHERE b.pattern_id = ?
            AND b.booking_status = 0
        `,
          [pattern_id]
        );

        await conn.query(
          `DELETE FROM recurring_pattern WHERE pattern_id = ?`,
          [pattern_id]
        );

        return NextResponse.json({ message: "Serie abgelehnt." });
      }

      // ===== Mehrere Einzelbuchungen =====
      if (Array.isArray(booking_ids) && booking_ids.length > 0) {
        await conn.query(
          `
          DELETE b, t
          FROM booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          WHERE b.booking_id IN (?)
        `,
          [booking_ids]
        );

        return NextResponse.json({ message: "Buchungen abgelehnt." });
      }

      // ===== Einzelbuchung =====
      if (booking_id) {
        await conn.query(
          `
          DELETE b, t
          FROM booking b
          JOIN timeslot t ON b.timeslot_id = t.timeslot_id
          WHERE b.booking_id = ?
        `,
          [booking_id]
        );

        return NextResponse.json({ message: "Buchung abgelehnt." });
      }
    }

    /* ==========================================================
       🔁 UPDATE END DATE
    ========================================================== */
    if (action === "update_end_date" && pattern_id && end_date) {
      await conn.query(
        `UPDATE recurring_pattern SET end_date = ?, until_date = ? WHERE pattern_id = ?`,
        [end_date, end_date, pattern_id]
      );

      await conn.query(
        `
        DELETE b, t
        FROM booking b
        JOIN timeslot t ON b.timeslot_id = t.timeslot_id
        WHERE b.pattern_id = ?
          AND t.slot_date > ?
      `,
        [pattern_id, end_date]
      );

      return NextResponse.json({ message: "Serie aktualisiert." });
    }

    return NextResponse.json({ message: "Ungültige Aktion." }, { status: 400 });

  } catch (err) {
    console.error("PUT /calendar Fehler:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  try {
    const booking_id = req.nextUrl.searchParams.get("booking_id");
    const pattern_id = req.nextUrl.searchParams.get("pattern_id");

    if (!booking_id && !pattern_id) {
      return NextResponse.json(
        { message: "booking_id oder pattern_id ist erforderlich." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    if (pattern_id) {
      const bookings = await conn.query(
        `SELECT b.timeslot_id FROM booking b WHERE b.pattern_id = ?`,
        [pattern_id]
      );

      if (bookings.length === 0) {
        return NextResponse.json({ message: "Serie nicht gefunden." }, { status: 404 });
      }

      for (const row of bookings) {
        await conn.query("DELETE FROM booking WHERE timeslot_id = ?", [row.timeslot_id]);
        await conn.query("DELETE FROM timeslot WHERE timeslot_id = ?", [row.timeslot_id]);
      }

      await conn.query("DELETE FROM recurring_pattern WHERE pattern_id = ?", [pattern_id]);

      return NextResponse.json({
        message: "Serie erfolgreich gelöscht.",
        pattern_id: Number(pattern_id),
      });
    } else {
      const bookingInfo = await conn.query(
        `SELECT b.timeslot_id FROM booking b WHERE b.booking_id = ?`,
        [booking_id]
      );

      if (bookingInfo.length === 0) {
        return NextResponse.json({ message: "Buchung nicht gefunden." }, { status: 404 });
      }

      const timeslot_id = bookingInfo[0].timeslot_id;

      await conn.query("DELETE FROM booking WHERE booking_id = ?", [booking_id]);
      await conn.query("DELETE FROM timeslot WHERE timeslot_id = ?", [timeslot_id]);

      return NextResponse.json({
        message: "Buchung erfolgreich gelöscht.",
        booking_id: Number(booking_id),
      });
    }
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

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

    const normalizedDate =
      typeof slot_date === "string" && slot_date.includes("T")
        ? slot_date.split("T")[0]
        : slot_date;

    const canBlock = await conn.query(
      `
      SELECT 
        TIMESTAMP(?, ?) >= NOW() AS ok
    `,
      [normalizedDate, start_time]
    );

    if (!canBlock?.[0]?.ok) {
      return NextResponse.json(
        { message: "Man kann keinen Raum in der Vergangenheit sperren." },
        { status: 400 }
      );
    }

    await conn.query(
      `
      UPDATE booking b
      JOIN timeslot t ON b.timeslot_id = t.timeslot_id
      SET b.booking_status = 1
      WHERE b.booking_status = 0
        AND TIMESTAMP(t.slot_date, t.start_time) < NOW()
    `
    );

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

    const result: any = await conn.query(
      "INSERT INTO timeslot (room_id, slot_date, start_time, end_time, timeslot_status, blocked_reason) VALUES (?, ?, ?, ?, 3, ?)",
      [room_id, normalizedDate, start_time, end_time, reason || "Gesperrt durch Admin"]
    );

    return NextResponse.json(
      {
        message: "Timeslot erfolgreich gesperrt.",
        timeslot_id: Number(result.insertId),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Fehler beim Sperren:", err);
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}