'use client';

import { useState, useMemo } from 'react';

type Weekday = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';

type Timeslot = {
    timeslot_id: number;
    room_id: number;
    status: number;
    slot_date: string;     // date (YYYY-MM-DD)
    start_time: string;    // time (HH:MM:SS)
    end_time: string;      // time (HH:MM:SS)
    blocked_reason?: string;
    name?: string;
};

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 08–20
const WEEKDAYS: Weekday[] = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
];

// Mock reservations to be replaced by the DB as soon as it's done
const ROOMS = [
    { room_id: 1, room_name: 'Raum 1' },
    { room_id: 2, room_name: 'Raum 2' }
];

const MOCK_TIMESLOTS: Timeslot[] = [
    { timeslot_id: 1, room_id: 1, status: 1, slot_date: '2025-11-18', start_time: '14:00:00', end_time: '17:00:00' },
    { timeslot_id: 2, room_id: 1, status: 1, slot_date: '2025-11-20', start_time: '09:00:00', end_time: '12:00:00' },
    { timeslot_id: 3, room_id: 2, status: 1, slot_date: '2025-11-19', start_time: '10:00:00', end_time: '13:00:00' },
    { timeslot_id: 4, room_id: 1, status: 1, slot_date: '2025-11-25', start_time: '11:00:00', end_time: '14:00:00' },
    { timeslot_id: 5, room_id: 2, status: 1, slot_date: '2025-11-27', start_time: '15:00:00', end_time: '18:00:00' },
    { timeslot_id: 6, room_id: 1, status: 1, slot_date: '2025-11-11', start_time: '08:00:00', end_time: '11:00:00' },
];

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit' 
    });
}

function getWeekRange(monday: Date): string {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    return `${monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${friday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getHourFromTime(timeStr: string): number {
    return parseInt(timeStr.split(':')[0], 10);
}


export default function RoomsPage() {
    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));

    const weekDates = useMemo(() => {
        return WEEKDAYS.map((_, index) => {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + index);
            return date;
        });
    }, [currentWeekStart]);
    
    const timeslotsForRoom = useMemo(
        () => MOCK_TIMESLOTS.filter((t) => t.room_id === selectedRoomId),
        [selectedRoomId]
    );
    
    const isReserved = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);
        return timeslotsForRoom.some((t) => {
            if (t.slot_date !== dateStr) return false;
            const startHour = getHourFromTime(t.start_time);
            const endHour = getHourFromTime(t.end_time);
            return hour >= startHour && hour < endHour;
        });
    };
    
    const isReservationStart = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);
         return timeslotsForRoom.some((t) => {
            if (t.slot_date !== dateStr) return false;
            const startHour = getHourFromTime(t.start_time);
            return hour === startHour;
        });
    };

    const goToPreviousWeek = () => {
        setCurrentWeekStart((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() - 7);
            return newDate;
        });
    };

    const goToNextWeek = () => {
        setCurrentWeekStart((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + 7);
            return newDate;
        });
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(getMonday(new Date()));
    };

    const isCurrentWeek = useMemo(() => {
        const todayMonday = getMonday(new Date());
        return currentWeekStart.toDateString() === todayMonday.toDateString();
    }, [currentWeekStart]);
    
    return (
    <main className="flex justify-center px-4 py-10 mt-25">
        <div className="w-full max-w-5xl rounded-3xl bg-[#dfeedd] px-8 pb-10 pt-8">
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                <select 
                    className="rounded-xl w-35 border border-[#0f692b] border-bold bg-white px-4 py-2 text-md text-[#0f692b] font-semibold"
                    value={selectedRoomId} 
                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                >
                        {ROOMS.map((room) => (
                            <option key={room.room_id} value={room.room_id}>
                                {room.room_name}
                            </option>
                        ))}
                </select>

            <div className="flex items-center gap-3">
                        <button
                            onClick={goToPreviousWeek}
                            className="rounded-lg bg-white border border-[#0f692b] px-3 py-1.5 text-[#0f692b] font-semibold hover:bg-[#0f692b] hover:text-white transition-colors"
                            aria-label="Vorherige Woche"
                        >
                            ← Zurück
                        </button>
                        
                        <div className="text-center">
                            <div className="text-sm font-semibold text-[#0f692b]">
                                {getWeekRange(currentWeekStart)}
                            </div>
                            {!isCurrentWeek && (
                                <button onClick={goToCurrentWeek} className="mt-1 text-xs text-[#0f692b] underline hover:text-[#0a4d1f]">
                                    Zur aktuellen Woche
                                </button>
                            )}
                        </div>
                        
                        <button onClick={goToNextWeek} className="rounded-lg bg-white border border-[#0f692b] px-3 py-1.5 text-[#0f692b] font-semibold hover:bg-[#0f692b] hover:text-white transition-colors" aria-label="Nächste Woche">
                            Weiter →
                        </button>
                    </div>
                </div>
            
            <div className="rounded-2xl bg-white px-5 pb-6 pt-5">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                    <div className="w-12"></div>
                    {WEEKDAYS.map((day, index) => (
                        <div key={day} className="rounded-t-md border-2 border-[#0f692b] border-b-0 py-1 text-center ">
                            <div className="text-sm font-bold text-[#0f692b]">
                                {day}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                                {formatDate(weekDates[index])}
                            </div>
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

                
                    {WEEKDAYS.map((day, dateIndex) => (
                        <div key={day} className="flex flex-col overflow-hidden rounded-b-md border-2 border-[#0f692b]">
                            {HOURS.map((hour, idx) => {
                                const reserved = isReserved(dateIndex, hour);
                                const start = isReservationStart(dateIndex, hour);
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
