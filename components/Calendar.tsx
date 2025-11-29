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
const WEEKDAYS: Weekday[] = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'];

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
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function formatFullDate(date: Date): string {
    return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getWeekRange(monday: Date): string {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return `${monday.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })} - ${friday.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}`;
}

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getHourFromTime(timeStr: string): number {
    return parseInt(timeStr.split(':')[0], 10);
}

export default function Calendar() {
    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    const weekDates = useMemo(() => WEEKDAYS.map((_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        return d;
    }), [currentWeekStart]);

    const timeslotsForRoom = useMemo(() => MOCK_TIMESLOTS.filter(t => t.room_id === selectedRoomId), [selectedRoomId]);

    const isReserved = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);
        return timeslotsForRoom.some(t => t.slot_date === dateStr && hour >= getHourFromTime(t.start_time) && hour < getHourFromTime(t.end_time));
    };

    const isReservationStart = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);
        return timeslotsForRoom.some(t => t.slot_date === dateStr && hour === getHourFromTime(t.start_time));
    };

    const goToPreviousWeek = () => setCurrentWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate()-7); return d; });
    const goToNextWeek = () => setCurrentWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate()+7); return d; });
    const goToCurrentWeek = () => setCurrentWeekStart(getMonday(new Date()));
    const goToPreviousDay = () => currentDayIndex > 0 ? setCurrentDayIndex(currentDayIndex-1) : (goToPreviousWeek(), setCurrentDayIndex(4));
    const goToNextDay = () => currentDayIndex < 4 ? setCurrentDayIndex(currentDayIndex+1) : (goToNextWeek(), setCurrentDayIndex(0));

    const isCurrentWeek = useMemo(() => currentWeekStart.toDateString() === getMonday(new Date()).toDateString(), [currentWeekStart]);

    return (
        <main className="flex justify-center px-2 pt-45 md:px-4 pb-2 md:pb-10 relative">
            <div className="w-full max-w-5xl rounded-2xl md:rounded-3xl bg-[#dfeedd] px-2 md:px-8 pb-2 md:pb-10 pt-2 md:pt-8 shadow-xl">
                
                {/* Room Selection & Navigation */}
                <div className="mb-2 md:mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-4">
                    <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                        className="rounded-xl w-full md:w-35 border border-[#0f692b] bg-white px-3 py-1 text-sm text-[#0f692b] font-semibold"
                    >
                        {ROOMS.map(r => <option key={r.room_id} value={r.room_id}>{r.room_name}</option>)}
                    </select>

                    <div className="hidden md:flex items-center gap-3">
                        <button onClick={goToPreviousWeek} className="rounded-lg bg-white border border-[#0f692b] px-3 py-1.5 text-[#0f692b] font-semibold hover:bg-[#0f692b] hover:text-white transition-colors">← Zurück</button>
                        <div className="text-center">
                            <div className="text-sm font-semibold text-[#0f692b]">{getWeekRange(currentWeekStart)}</div>
                            {!isCurrentWeek && <button onClick={goToCurrentWeek} className="mt-1 text-xs text-[#0f692b] underline hover:text-[#0a4d1f]">Zur aktuellen Woche</button>}
                        </div>
                        <button onClick={goToNextWeek} className="rounded-lg bg-white border border-[#0f692b] px-3 py-1.5 text-[#0f692b] font-semibold hover:bg-[#0f692b] hover:text-white transition-colors">Weiter →</button>
                    </div>
                </div>

                {/* Desktop Kalender */}
                <div className="hidden md:block rounded-2xl bg-white px-5 pb-6 pt-5">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                        <div className="w-12"></div>
                        {WEEKDAYS.map((day, i) => (
                            <div key={day} className="rounded-t-md border-2 border-[#0f692b] border-b-0 py-1 text-center">
                                <div className="text-sm font-bold text-[#0f692b]">{day}</div>
                                <div className="text-xs text-gray-600 mt-0.5">{formatDate(weekDates[i])}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                        <div className="flex w-12 flex-col">
                            {HOURS.map(h => <div key={h} className="flex min-h-[32px] items-center justify-center text-xs font-medium text-gray-400">{h.toString().padStart(2,'0')}</div>)}
                        </div>
                        {WEEKDAYS.map((_, dayIdx) => (
                            <div key={dayIdx} className="flex flex-col overflow-hidden rounded-b-md border-2 border-[#0f692b]">
                                {HOURS.map((h, idx) => {
                                    const reserved = isReserved(dayIdx,h);
                                    const start = isReservationStart(dayIdx,h);
                                    return (
                                        <div key={h} className={['relative flex min-h-[32px] items-center border-t border-[#0f692b] text-xs', idx===0?'border-t-0':'', reserved?'bg-[#f8d9f2]':'bg-white'].filter(Boolean).join(' ')}>
                                            {start && <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[11px] font-semibold text-[#a3158f]">Reserviert</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Kalender */}
                <div className="md:hidden rounded-xl bg-white p-1 max-h-[60vh] overflow-y-auto">
                    <div className="flex gap-1 min-w-max">
                        <div className="flex flex-col w-8 flex-shrink-0">
                            <div className="h-6 flex items-center justify-center"></div>
                            {HOURS.map(h => <div key={h} className="flex min-h-[24px] items-center justify-center text-[8px] font-medium text-gray-500">{h.toString().padStart(2,'0')}:00</div>)}
                        </div>
                        <div className="flex-1">
                            <div className="rounded-t-lg border-2 border-[#0f692b] border-b-0 py-0.5 text-center bg-[#0f692b]">
                                <div className="text-[10px] font-bold text-white">{WEEKDAYS[currentDayIndex]}</div>
                            </div>
                            <div className="flex flex-col rounded-b-lg border-2 border-[#0f692b] overflow-hidden">
                                {HOURS.map((h, idx) => {
                                    const reserved = isReserved(currentDayIndex,h);
                                    const start = isReservationStart(currentDayIndex,h);
                                    return (
                                        <div key={h} className={['relative flex min-h-[24px] items-center justify-center border-t border-[#0f692b]', idx===0?'border-t-0':'', reserved?'bg-[#f8d9f2]':'bg-white'].filter(Boolean).join(' ')}>
                                            {start && <span className="text-[8px] font-semibold text-[#a3158f]">Reserviert</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    )
}
