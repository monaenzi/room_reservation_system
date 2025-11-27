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
        return NextResponse.json(
            {message: "room creation endpoint"},
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