import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

function getSmtpConfig() {
    const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = port === 465;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!user || !pass) {
        throw new Error("SMTP_USER oder SMTP_PASSWORD fehlen in .env");
    }

    return {
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { servername: host },
    } as const;
}

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

        conn = await pool.getConnection();

        const rows = await conn.query(
            "SELECT user_id FROM users WHERE email = ? AND first_name = ? AND last_name = ? LIMIT 1",
            [email, first_name, last_name]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "Keine passenden Daten gefunden." },
                { status: 404 }
            );
        }

        const fixedRecipient = "greenkait865@gmail.com";

        const smtp = getSmtpConfig();
        const transporter = nodemailer.createTransport(smtp);
        await transporter.verify();

        const logoPath = path.join(process.cwd(), "public", "logo.svg");
        const hasLogo = fs.existsSync(logoPath);
        const logoBuffer = hasLogo ? fs.readFileSync(logoPath) : null;

        const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head><meta charset="UTF-8" /></head>
      <body style="font-family: Arial, sans-serif; background:#ffffff; color:#111;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
          <div style="margin-bottom: 16px;">
            ${hasLogo ? `<img src="cid:kaitlogo" alt="KAIT Logo" style="height:48px;" />` : ""}
          </div>

          <h2 style="margin: 0 0 12px;">Passwort Zurücksetzen - Anfrage erhalten</h2>

          <p style="margin: 0 0 12px;">Hallo ${String(first_name)},</p>

          <p style="margin: 0 0 12px;">
            Vielen Dank für deine Anfrage zum Zurücksetzen deines Passwortes.<br/>
            Deine Anfrage wurde erfolgreich übermittelt und ein Administrator wird sich in Kürze darum kümmern.
          </p>

          <p style="margin: 0 0 18px;">
            Bitte habe etwas Geduld – du wirst benachrichtigt, sobald dein Passwort zurückgesetzt oder weitere Schritte notwendig sind.
          </p>

          <p style="margin: 0;">
            Mit freundlichen Grüßen,<br/>
            Dein KAIT Team
          </p>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

          <div style="font-size: 12px; color:#444;">
            <strong>IMPRESSUM</strong><br/><br/>
            FH JOANNEUM GmbH, University of Applied Sciences<br/>
            INSTITUTE Software Design and Security<br/>
            Werk-VI-Straße 46<br/>
            8605 Kapfenberg, AUSTRIA<br/>
            T: +43 3862 6542-0<br/>
            E: <a href="mailto:info@joanneum.at">info@joanneum.at</a><br/><br/>
            <a href="https://www.fh-joanneum.at/hochschule/organisation/datenschutz/">Data protection FH JOANNEUM</a><br/>
            No liability is assumed for linked content.
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM ?? process.env.SMTP_USER!,
            to: [email, fixedRecipient],
            subject: "KAIT-Raumbuchung - Passwort zurücksetzen",
            text:
                "Ihre Anfrage zum Zurücksetzen des Passwortes wurde empfangen. Ein Administrator wird sich darum kümmern.",
            html,
            attachments: hasLogo
                ? [
                    {
                        filename: "logo.svg",
                        content: logoBuffer!,
                        cid: "kaitlogo",
                        contentType: "image/svg+xml",
                    },
                ]
                : [],
        });

        return NextResponse.json({ message: "E-Mail wurde versendet." }, { status: 200 });
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