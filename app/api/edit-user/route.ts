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

export async function PUT(req: NextRequest) {
  let conn: mariadb.PoolConnection | undefined;

  
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const user_id = pathParts[pathParts.length - 1];

    const {first_name, last_name, email, phone_number, role, password} = await req.json();
    if(!first_name && !last_name && !email && !phone_number && !role && !password) {
        return NextResponse.json(
            {message: "mindestens ein Feld muss angegeben werden."},
            {status: 400}
        );
    }



    try{
        conn = await pool.getConnection();
    } catch (err) {
        console.error("DB Verbindung fehlgeschlagen:", err);
        return NextResponse.json(
            {message: "Verbindung zur DB nicht möglich"},
            {status: 500}
        );
    }



    const userExists = await conn.query(
        "SELECT user_id FROM users WHERE user_id = ? LIMIT 1",
        [user_id]
    ); 

    if(!userExists || userExists === 0) {
        return NextResponse.json(
            {message: "Benutzer nicht gefunden"},
            {status: 404}
        );
    }


    const updates: string[] = [];
    const values: any[] = [];

    if (first_name){
        updates.push("first_name = ?");
        values.push(first_name);
    }

    if(last_name) {
        updates.push("last_name = ?");
        values.push(last_name);
    }

    if(email) {
        updates.push("email = ?");
        values.push(email);
    }

    if(phone_number){
        updates.push("phone_number = ?");
        values.push(phone_number);
    }

    if (role) {
        const role_id = role === "admin" ? 1 : 2;
        updates.push("role_id = ?");
        values.push(role_id);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        updates.push("password_hash = ?");
        values.push(hashedPassword);
    }

    values.push(user_id);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`
    await conn.query(query, values);


    const updateUser = await conn.query(
        "SELECT user_id, username, first_name, last_name, email, phone_number, role_id FROM users WHERE user_id = ? LIMIT 1",
        [user_id]
    );

    const userData = updateUser[0];
    const userRole = userData.role_id === 1 ? "admin" : "user";


    return NextResponse.json(
        {
            message : "Benutzer erfolgreich aktualisiert",
            user: {
                user_id: userData.user_id,
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                phone_number: userData.phone_number,
                role: userRole
            }
        },
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

export async function DELETE(req: NextRequest) {
    let conn: mariadb.PoolConnection | undefined;

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const user_id = pathParts[pathParts.length - 1];

        try {
            conn = await pool.getConnection();
        } catch(err) {
            console.error("db Verbindung fehlgeschlagen:", err);
            return NextResponse.json(
                {message: "Verbidung zur DB nicht möglich"},
                {status: 500}
            );
        }

        const userExists = await conn.query(
            "SELECT user_id, username FROM users WHERE user_id = ? LIMIT 1",
            [user_id]
        );

        if(!userExists || userExists === 0){
            return NextResponse.json(
                {message: "Benutzer nicht gefunden"},
                {status: 404}
            );
        }

        await conn.query(
            "DELETE FROM booking WHERE user_id = ?",
            [user_id]
        );

        await conn.query(
            "DELETE FROM users WHERE user_id = ?",
            [user_id]
        );

        return NextResponse.json(
            {
                message: "Benutzer erfolgreich gelöscht",
                delete_user: {
                    user_id: userExists[0].user_id,
                    username: userExists[0].username
                }
            },
            {status: 200}
        );
    } catch(err){
        console.error("Feheler beim User Löschen", err);
        return NextResponse.json(
            {message: "Serverfehler"},
            {status: 500}
        );
    } finally {
        if (conn) conn.release();
    }
}