import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_port ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

export async function POST(req:NextRequest) {
    let conn: mariadb.PoolConnection | undefined;

    try{

        const {
            room_name,
            room_description,
            room_capacity,
            floor_number,
            building,
            created_by
        } = await req.json();

        if (!room_name){
            return NextResponse.json(
                {message: "Raumname ist erforderlich"},
                {status: 400}
            );
        }

        if(!created_by){
            return NextResponse.json(
                {message: "Admin Id ist erforderlich"},
                {status: 400}
            );
        }


        try {
            conn = await pool.getConnection();
        } catch (err) {
            console.error("db Verbindung fehlgeschlagen:", err);
            return NextResponse.json (
                {message : "Verbindung zur DB nicht möglich"},
                {status: 500}
            );
        }

        const adminCheck = await conn.query(
            "SELECT user_id, role_id FROM users WHERE  user_id = ? LIMIT 1",
            [created_by]
        );

        if(!adminCheck || adminCheck.length === 0){
            return NextResponse.json(
                {message: "Benutzer nicht gefunden"},
                {status: 404}
            );
        }

        if(adminCheck[0].role_id !== 1){
            return NextResponse.json(
                {message: "Keine Berechtigung. Nur Administratoren können Räume erstellen"},
                {status: 403}
            );
        }


        

        return NextResponse.json(
            {message: "validation passed"},
            {status: 200}
        );
    } catch (err) {
        console.error("unerwarteter Fehler:", err);
        return NextResponse.json(
            {message: "interner Serverfehler"},
            {status: 500}
        );
    } finally{
        if (conn) conn.release();
    }
    
}