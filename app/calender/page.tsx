'use client';

import { useState, useMemo } from 'react';

type Weekday = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';

type ReservationBlock = {
    id: string;
    room: string;
    weekday: Weekday;
    startHour: number; // is included
    endHour: number;   // is excluded
};

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 07–18
const WEEKDAYS: Weekday[] = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
];

// Mock reservations to be replaced by the DB as soon as it's done
const ROOMS = ['Raum 1', 'Raum 2'];

const MOCK_RESERVATIONS: ReservationBlock[] = [
    { id: '1', room: 'Raum 1', weekday: 'Montag', startHour: 14, endHour: 17 },
    { id: '2', room: 'Raum 1', weekday: 'Mittwoch', startHour: 9, endHour: 12 },
    { id: '3', room: 'Raum 2', weekday: 'Dienstag', startHour: 10, endHour: 13 },
];

export default function RoomsPage() {
    const [selectedRoom, setSelectedRoom] = useState<string>('Raum 1');
    
    const reservationsForRoom = useMemo(
        () => MOCK_RESERVATIONS.filter((r) => r.room === selectedRoom),
        [selectedRoom]
    );
    
    const isReserved = (weekday: Weekday, hour: number) =>
        reservationsForRoom.some(
            (r) => r.weekday === weekday && hour >= r.startHour && hour < r.endHour
    );
    
    const isReservationStart = (weekday: Weekday, hour: number) =>
        reservationsForRoom.some(
            (r) => r.weekday === weekday && hour === r.startHour
    );
    
    return (
    <main className="flex justify-center px-4 py-10 mt-25">
        <div className="w-full max-w-5xl rounded-3xl bg-[#dfeedd] px-8 pb-10 pt-8">
            <div className="mb-6">
                <select className="rounded-xl w-35 border border-[#0f692b] border-bold bg-white px-4 py-1 text-md text-[#0f692b] font-semibold" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                    {ROOMS.map((room) => (
                        <option key={room} value={room}>
                            {room}
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="rounded-2xl bg-white px-5 pb-6 pt-5">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                    <div className="w-12"></div>
                    {WEEKDAYS.map((day) => (
                        <div key={day} className="rounded-t-md border-2 border-[#0f692b] border-b-0 py-1 text-center text-sm font-bold text-[#0f692b]">
                            {day}
                        </div>
                    ))}
                </div>
            
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                    <div className="flex w-12 flex-col">
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex min-h-[32px] items-center justify-center text-xs font-medium text-gray-400">
                                {hour.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>

                
                    {WEEKDAYS.map((day) => (
                        <div key={day} className="flex flex-col overflow-hidden rounded-b-md border-2 border-[#0f692b]">
                            {HOURS.map((hour, idx) => {
                                const reserved = isReserved(day, hour);
                                const start = isReservationStart(day, hour);
                                return (
                                    <div key={hour} className={['relative flex min-h-[32px] items-center border-t border-[#0f692b] text-xs',
                                    idx === 0 ? 'border-t-0' : '', reserved ? 'bg-[#f8d9f2]' : 'bg-white',].filter(Boolean).join(' ')}>
                                        {start && (
                                            <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[11px] font-semibold text-[#a3158f]">
                                                Reserviert
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </main>
    );
}
