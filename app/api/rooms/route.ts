import { NextRequest, NextResponse } from "next/server";
import mariadb from "mariadb";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { cwd } from "process";

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

async function checkAdmin(conn: mariadb.PoolConnection, userId: any): Promise<boolean> {
    if (!userId) return false;
    const rows = await conn.query("SELECT role_id FROM users WHERE user_id = ? LIMIT 1", [userId]);
    return rows.length > 0 && rows[0].role_id === 1;
}

function errorResponse(message: string, status: number) {
    return NextResponse.json({ message }, { status });
}

export async function POST(req:NextRequest) {
    let conn: mariadb.PoolConnection | undefined;

    try{
        const formData = await req.formData();
        const room_name = formData.get("room_name") as string;
        const room_description = formData.get("room_description") as string;
        const raw_capacity = formData.get("room_capacity");
        const room_capacity = raw_capacity ? Number(raw_capacity) : null;
        const raw_floor = formData.get("floor_number");
        const floor_number = raw_floor ? Number (raw_floor) : null;
        const building = formData.get("building") as string;
        const created_by = formData.get("created_by");
        const imageFile = formData.get("image") as File | null;

        if (!room_name){
            return errorResponse("Raumname ist erforderlich", 400);
        }

        if(!created_by){
            return errorResponse("Admin ID ist erforderlich", 400);
        }

        let image_url = null;
        if (imageFile && imageFile.size > 0){
            try{
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                const sanatizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                const filename = `${Date.now()}_${sanatizedName}`;
                const uploadDir = path.join(process.cwd(), "public", "uploads");
                await mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, buffer);
                image_url = `/uploads/${filename}`;
            } catch (err){
                console.error("Fehler beim Hochladen des Bildes:", err);
                throw new Error("Fehler beim Speichern des Bildes");
            }
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

        const isAdmin = await checkAdmin(conn, created_by);
        if(!isAdmin){
            return errorResponse("Keine Berechtigung. Nur Admins können Räume erstellen", 403);
        }

        const result = await conn.query(
            `INSERT INTO room (room_name, room_description, room_capacity, floor_number, building, created_by, is_visible, image_url) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
            [room_name, room_description || null, room_capacity || null, floor_number || null, building || null, created_by, image_url || null]
        );

        const newRoom = await conn.query(
            "SELECT * FROM room WHERE room_id = ? LIMIT 1",
            [result.insertId]
        );


        return NextResponse.json(
            {message: "Raum erfolgreich erstellt",
               room: newRoom[0] 
            },
            {status: 201}
        );
    } catch (err) {
        console.error("unerwarteter Fehler:", err);
        return errorResponse("interner Serverfehler", 500);
    } finally{
        if (conn) conn.release();
    } 
}




export async function GET(req: NextRequest){
    let conn: mariadb.PoolConnection | undefined;

    try {
        const { searchParams } = new URL(req.url);
        const visibleOnly = searchParams.get('visible') === 'true';
        const room_id = searchParams.get('room_id');

        try{
            conn = await pool.getConnection();
        } catch (err) {
            console.error("DB Verbindung fehlgeschlagen:", err);
            return errorResponse("Verbindung zur DB nicht möglich", 500);
        }

        if (room_id){
            const room = await conn.query(
                "SELECT * FROM room WHERE room_id = ? LIMIT 1",
                [room_id]
            );

        if (!room || room.length === 0) {
            return errorResponse("Raum nicht gefunden", 404);
        }

        return NextResponse.json(
            {message: "Raum erfolgreich abgerufen",
                room: room[0]
            },
            {status: 200}
        );
    }

        let query = "SELECT * FROM room";
        if (visibleOnly){
            query += " WHERE is_visible = 1";
        }
            query += " ORDER BY room_name ASC";
            const rooms = await conn.query(query);

        return NextResponse.json(
            {message: "Räume erfolgreich abgerufen",
                rooms: rooms,
                count: rooms.length
            },
            {status: 200}
        );
    } catch (err){
        console.error("unerwarteter Fehler", err);
        return errorResponse("interner Serverehler", 500);
    } finally {
        if (conn) conn.release();
    }
}



export async function PUT(req: NextRequest){
    let conn: mariadb.PoolConnection | undefined;

    try {

        const {
            room_id,
            room_name,
            room_description,
            room_capacity,
            floor_number,
            building,
            admin_id
        } = await req.json();

        if(!room_id){
            return errorResponse("Raum id ist erforderlich", 400);
        }

        if(!room_name && !room_description && room_capacity === undefined && floor_number === undefined && !building) {
            return errorResponse("Mindestens ein Feld muss angegeben", 400);
        }

        try{
            conn = await pool.getConnection();
        } catch (err){
            console.error("DB Verbindung fehlgeschlagen", err);
            return errorResponse("Verbindung zur DB nicht möglich", 500);
        }

        if (!admin_id) {
            return NextResponse.json({ message: "Admin ID fehlt" }, { status: 400 });
        }
        const isAdmin = await checkAdmin(conn, admin_id);
        if (!isAdmin) {
            return NextResponse.json(
                { message: "Keine Berechtigung zum Bearbeiten" },
                { status: 403 }
            );
        }

        const roomExists = await conn.query(
            "SELECT room_id FROM room WHERE room_id = ? LIMIT 1",
            [room_id]
        );

        if(!roomExists || roomExists.length === 0){
            return errorResponse("Raum nicht gefunden", 404);
        }


        const updates: string[] = [];
        const values: any[] = [];

        if(room_name){
            updates.push("room_name = ?");
            values.push(room_name);
        }

        if(room_description !== undefined){
            updates.push("room_description = ?");
            values.push(room_description);
        }

        if(room_capacity !== undefined){
            updates.push("room_capacity = ?");
            values.push(room_capacity);
        }

        if(floor_number !== undefined){
            updates.push("floor_number = ?");
            values.push(floor_number);
        }

        if(building !== undefined){
            updates.push("building = ?");
            values.push(building);
        }

        values.push(room_id);

        const query = `UPDATE room SET ${updates.join(", ")} WHERE room_id = ?`;
        await conn.query(query, values);

        const updatedRoom = await conn.query(
            "SELECT * FROM room WHERE room_id = ? LIMIT 1",
            [room_id]
        );

        return NextResponse.json (
            {message: "Raum wurde aktualisiert",
                room: updatedRoom[0]
            },
            {status: 200}
        );
    } catch (err){
        console.error("unerwarteter Fehler", err);
        return errorResponse("interner Fehler", 500);
    } finally{
        if (conn) conn.release();
    }
}



export async function PATCH(req: NextRequest){
    let conn: mariadb.PoolConnection | undefined;

    try{
        const body = await req.json();
        const { room_id, is_visible, admin_id } = body;

    if(!room_id) {
        return errorResponse("Raum id ist erforderlich", 400);
    }

    try{
        conn = await pool.getConnection();
    } catch(err){
        console.error("DB Verbindung fehlgeschlagen", err);
        return errorResponse("Verbindung zur DB nicht möglich", 500);
    }

    if (!admin_id) {
            return NextResponse.json({ message: "Admin ID fehlt" }, { status: 400 });
        }
        const isAdmin = await checkAdmin(conn, admin_id);
        if (!isAdmin) {
            return NextResponse.json(
                { message: "Keine Berechtigung Status zu ändern" },
                { status: 403 }
            );
        }

    const roomExists = await conn.query(
        "SELECT room_id, is_visible FROM room WHERE room_id = ? LIMIT 1",
        [room_id]
    );

    if(!roomExists || roomExists.length === 0){
        return errorResponse("Raum nicht gefunden", 404);
    }

    const visibility = body.is_visible ? 1 : 0;

    await conn.query(
        "UPDATE room SET is_visible = ? WHERE room_id = ?",
        [visibility, room_id]
    );

    return NextResponse.json(
        { message: "Raum ist nicht mehr sichtbar",
            room_id: parseInt(room_id),
            is_visible: visibility === 1
        },
        {status: 200}
    );
    } catch(err){
        console.error("unerwarteter Fehler", err);
        return errorResponse("interner Fehler", 500);
    } finally {
        if (conn) conn.release();
    }
}



export async function DELETE(req: NextRequest) {
    let conn: mariadb.PoolConnection | undefined;

    try{
        const body = await req.json();
        const { room_id, admin_id } = body;

        if(!room_id){
            return errorResponse("Raum id ist erforderlich", 400);
        }

        try{
            conn = await pool.getConnection();
        } catch(err){
            console.error("DB Verbindung fehlgeschlagen", err);
            return errorResponse("Verbindung zur DB nicht möglich", 500);
        }

        if (!admin_id) {
            return NextResponse.json({ message: "Admin ID fehlt" }, { status: 400 });
        }

        const isAdmin = await checkAdmin(conn, admin_id);

        if (!isAdmin) {
            return NextResponse.json(
                { message: "Keine Berechtigung zum Löschen" },
                { status: 403 }
            );
        }

        const rows = await conn.query(
            "SELECT image_url FROM room WHERE room_id = ? LIMIT 1",
            [room_id]
        );

        if (!rows || rows.length === 0) {
            return errorResponse("Raum nicht gefunden", 404);
        }

        const room = rows[0];

        if (room.image_url) {
            try {
                const relativePath = room.image_url.startsWith('/')
                ? room.image_url.slice(1)
                : room.image_url;

            const absolutePath = path.join(cwd(), "public", relativePath);

            await unlink(absolutePath);
            console.log(`Bild gelöscht: ${absolutePath}`);
            } catch (fileErr) {
                console.warn("Konnte Bilddatei nicht löschen (vlt existiert sie nicht mehr):", fileErr);
            }
        }

        await conn.query(
            "DELETE FROM booking WHERE timeslot_id IN (SELECT timeslot_id FROM timeslot WHERE room_id = ?)",
            [room_id]
        );

        await conn.query(
            "DELETE FROM timeslot WHERE room_id = ?",
            [room_id]
        );

        await conn.query(
            "DELETE FROM room WHERE room_id = ?",
            [room_id]
        );


        return NextResponse.json(
            {message: "Raum wurde gelöscht",
            room_id: parseInt(room_id)    
            },
            {status: 200}
        );
    } catch(err){
        console.error("unerwarteter Fehler", err);
        return errorResponse("interner Fehler", 500);
    } finally{
        if (conn) conn.release();
    }
}