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

// Typ für Timeslot
type Timeslot = {
  timeslot_id: number;
  room_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  timeslot_status: number;
};

// Typ für Insert-Ergebnis
type InsertResult = {
  insertId: number;
  affectedRows?: number;
  warningStatus?: number;
};
