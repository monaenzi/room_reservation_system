import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";
import nodemailer from "nodemailer";

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function POST(req: NextRequest) {
    let conn: mariadb.PoolConnection | undefined;

    try {
        const { email, first_name, last_name } = await req.json();

        if (!email || !first_name || !last_name) {
            return NextResponse.json(
                { message: "E-Mail, Vorname und Nachname sind erforderlich." },
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
            "SELECT id FROM users WHERE email = ? AND first_name = ? AND last_name = ? LIMIT 1",
            [email, first_name, last_name]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "Keine passenden Daten gefunden." },
                { status: 404 }
            );
        }

        const fixedRecipient = "xxxxx@xxxx.at"; // Hier KAIT e-Mail angeben.

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
                to: [email, fixedRecipient],
                subject: "KAIT-Raumbuchung - Passwort zurücksetzen",
                text: "Beispieltext",
                html: `
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8" />
                    <title>Passwort zurücksetzen – KAIT</title>
                </head>
                <body>

                    <div class="container">
                        <div class="logo">
                        <img src="public/logo.svg" alt="KAIT Logo" />
                        </div>

                    <h1>Passwort Zurücksetzen - Anfrage erhalten</h1>

                        <p>Hallo ${first_name},</p>

                        <p>
                            Vielen Dank für deine Anfrage zum Zurücksetzen deines Passwortes.<br>
                            Deine Anfrage wurde erfolgreich übermittelt und ein Administrator wird sich in Kürze darum kümmern.
                        </p>

                        <p> 
                            Bitte habe etwas Geduld – du wirst benachrichtigt, sobald dein Passwort zurückgesetzt oder weitere Schritte notwendig sind.
                        </p>

                        <p>
                            Mit freundlichen Grüßen,<br />
                            Dein KAIT Team
                        </p>
                    </div>



                </body>
                </html>        
                `,
            });
        } catch (err) {
            console.error("Mailversand fehlgeschlagen:", err);
            return NextResponse.json(
                { message: "Mailversand fehlgeschlagen." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "E-Mail wurde versendet." },
            { status: 200 }
        );
    } catch (err) {
        console.error("Fehler im pwforgotten-Endpoint:", err);
        return NextResponse.json(
            { message: "Interner Serverfehler." },
            { status: 500 }
        );
    } finally {
        if (conn) conn.release();
    }
}
