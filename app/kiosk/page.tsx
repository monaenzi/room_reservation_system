'use client';

import { useState, useEffect } from 'react';

type Booking = {
  timeslot_id: number;
  room_id: number;
  room_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  username: string;
  reason: string;
  name: string;
  booking_status: number;
};

export default function KioskPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<{room_id: number, room_name: string}[]>([]);

  // Räume laden
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms?visible=true');
        const data = await res.json();
        if (data.rooms) {
          setRooms(data.rooms);
        }
      } catch (error) {
        console.error('Fehler:', error);
      }
    };
    fetchRooms();
  }, []);

  // Buchungen laden
  const loadBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      const allBookings: Booking[] = [];
      
      for (const room of rooms) {
        try {
          const res = await fetch(`/api/calendar?room_id=${room.room_id}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              allBookings.push({
                ...item,
                room_name: room.room_name
              });
            });
          }
        } catch (error) {
          console.error(`Fehler:`, error);
        }
      }

      // Heutige Buchungen filtern und sortieren
      const todayBookings = allBookings
        .filter((item) => {
          const slotDate = item.slot_date?.toString().split('T')[0];
          if (!slotDate || slotDate !== today) return false;
          if (item.booking_status !== 1) return false;
          const endTime = new Date(`${today}T${item.end_time}`);
          return endTime > now;
        })
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      setBookings(todayBookings);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Auto-Refresh
  useEffect(() => {
    if (rooms.length === 0) return;
    
    loadBookings();
    const interval = setInterval(loadBookings, 20000);
    return () => clearInterval(interval);
  }, [rooms]);

  const formatTime = (time: string) => time.substring(0, 5);

  const isCurrentBooking = (booking: Booking) => {
    const today = new Date().toISOString().split('T')[0];
    const startTime = new Date(`${today}T${booking.start_time}`);
    const endTime = new Date(`${today}T${booking.end_time}`);
    const now = new Date();
    return startTime <= now && endTime > now;
  };

  const isUpcomingBooking = (booking: Booking) => {
    const today = new Date().toISOString().split('T')[0];
    const startTime = new Date(`${today}T${booking.start_time}`);
    const now = new Date();
    return startTime > now;
  };

  const currentBookings = bookings.filter(isCurrentBooking);
  const upcomingBookings = bookings.filter(isUpcomingBooking);

  return (
    <div className="min-h-screen bg-[#dfeedd] p-4">
      {/* Nur Liste, nichts anderes */}
      {bookings.length === 0 ? (
        <div className="text-center pt-20 text-gray-500">
          Keine Buchungen
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-2">
          {/* Laufende Buchungen - GRÜN */}
          {currentBookings.map((booking) => (
            <div 
              key={booking.timeslot_id}
              className="bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold">
                  {formatTime(booking.start_time)}-{formatTime(booking.end_time)}
                </div>
                <div className="text-sm">
                  {booking.room_name}
                </div>
                <div className="flex-1">
                  {booking.username}
                </div>
                <div className="text-sm">
                  {booking.reason || booking.name}
                </div>
              </div>
            </div>
          ))}

          {/* Kommende Buchungen - WEISS */}
          {upcomingBookings.map((booking) => (
            <div 
              key={booking.timeslot_id}
              className="bg-white border border-[#0f692b] rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-[#0f692b]">
                  {formatTime(booking.start_time)}-{formatTime(booking.end_time)}
                </div>
                <div className="text-sm text-gray-600">
                  {booking.room_name}
                </div>
                <div className="text-gray-700 flex-1">
                  {booking.username}
                </div>
                <div className="text-gray-800 text-sm">
                  {booking.reason || booking.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}