'use client';

import { useState, useEffect, useMemo } from 'react';

type Role = 'guest' | 'user' | 'admin';
type Weekday = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';

type Timeslot = {
    timeslot_id: number;
    room_id: number;
    status: number;
    slot_date: string;
    start_time: string;
    end_time: string;
    blocked_reason?: string;
    name?: string;
};

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);
const WEEKDAYS: Weekday[] = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

const ROOMS = [
    { room_id: 1, room_name: 'Raum 1' },
    { room_id: 2, room_name: 'Raum 2' },
];

const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

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
        month: '2-digit',
    });
}

function formatFullDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function getWeekRange(monday: Date): string {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return `${monday.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })} - ${friday.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })}`;
}

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getHourFromTime(timeStr: string): number {
    return parseInt(timeStr.split(':')[0], 10);
}

export default function RoomsPage() {
    const [role, setRole] = useState<Role>('guest');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [showPopup, setShowPopup] = useState(false);
    const [showBlockPopup, setShowBlockPopup] = useState(false);

    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [blockRoomId, setBlockRoomId] = useState(1);
    const [blockDate, setBlockDate] = useState('');
    const [blockAllDay, setBlockAllDay] = useState(false);
    const [blockStart, setBlockStart] = useState('08:00');
    const [blockEnd, setBlockEnd] = useState('20:00');


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const storedRole = (localStorage.getItem('userRole') as Role) || 'guest';

            if (!isLoggedIn) setRole('guest');
            else if (storedRole === 'admin') setRole('admin');
            else setRole('user');
        }
    }, []);

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

    const goToPreviousDay = () => {
        if (currentDayIndex > 0) {
            setCurrentDayIndex(currentDayIndex - 1);
        } else {
            goToPreviousWeek();
            setCurrentDayIndex(4);
        }
    };

    const goToNextDay = () => {
        if (currentDayIndex < 4) {
            setCurrentDayIndex(currentDayIndex + 1);
        } else {
            goToNextWeek();
            setCurrentDayIndex(0);
        }
    };

    const isCurrentWeek = useMemo(() => {
        const todayMonday = getMonday(new Date());
        return currentWeekStart.toDateString() === todayMonday.toDateString();
    }, [currentWeekStart]);

    const handleBlockSubmit = () => {
    console.log({
        room: blockRoomId,
        date: blockDate,
        allDay: blockAllDay,
        from: blockStart,
        to: blockEnd
    });

    setShowBlockPopup(false);
};

    return (
        <>
            <main className="flex justify-center px-2 pt-25 md:px-4 pt-20 md:pt-35 pb-2 md:pb-10">
                <div className="w-full max-w-5xl rounded-2xl md:rounded-3xl bg-[#dfeedd] px-2 md:px-8 pb-2 md:pb-10 pt-2 md:pt-8 shadow-xl">
                    <div className="mb-2 md:mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-4">
                        <select
                            className="rounded-xl w-full md:w-35 border border-[#0f692b] bg-white px-3 py-1 text-sm text-[#0f692b] font-semibold"
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                        >
                            {ROOMS.map((room) => (
                                <option key={room.room_id} value={room.room_id}>
                                    {room.room_name}
                                </option>
                            ))}
                        </select>

                        <div className="hidden md:flex items-center gap-3">
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
                                    <button
                                        onClick={goToCurrentWeek}
                                        className="mt-1 text-xs text-[#0f692b] underline hover:text-[#0a4d1f]"
                                    >
                                        Zur aktuellen Woche
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={goToNextWeek}
                                className="rounded-lg bg-white border border-[#0f692b] px-3 py-1.5 text-[#0f692b] font-semibold hover:bg-[#0f692b] hover:text-white transition-colors"
                                aria-label="Nächste Woche"
                            >
                                Weiter →
                            </button>
                        </div>
                    </div>

                    <div className="flex md:hidden items-center gap-1.5 w-full pb-2">
                        <button
                            onClick={goToPreviousDay}
                            className="rounded-lg bg-white border-2 border-[#0f692b] px-2 py-1 text-[#0f692b] text-sm font-semibold hover:bg-[#0f692b] hover:text-white transition-colors flex-shrink-0"
                            aria-label="Vorheriger Tag"
                        >
                            ←
                        </button>

                        <div className="text-center flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-[#0f692b] truncate">
                                {formatFullDate(weekDates[currentDayIndex])}
                            </div>
                            {!isCurrentWeek && (
                                <button
                                    onClick={goToCurrentWeek}
                                    className="mt-0.5 text-[9px] text-[#0f692b] underline hover:text-[#0a4d1f]"
                                >
                                    Heute
                                </button>
                            )}
                        </div>

                        <button
                            onClick={goToNextDay}
                            className="rounded-lg bg-white border-2 border-[#0f692b] px-2 py-1 text-[#0f692b] text-sm font-semibold hover:bg-[#0f692b] hover:text-white transition-colors flex-shrink-0"
                            aria-label="Nächster Tag"
                        >
                            →
                        </button>
                    </div>

                    <div className="hidden md:block rounded-2xl bg-white px-5 pb-6 pt-5">
                        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                            <div className="w-12" />
                            {WEEKDAYS.map((day, index) => (
                                <div
                                    key={day}
                                    className="rounded-t-md border-2 border-[#0f692b] border-b-0 py-1 text-center "
                                >
                                    <div className="text-sm font-bold text-[#0f692b]">{day}</div>
                                    <div className="text-xs text-gray-600 mt-0.5">
                                        {formatDate(weekDates[index])}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2">
                            <div className="flex w-12 flex-col">
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className="flex min-h-[32px] items-center justify-center text-xs font-medium text-gray-400"
                                    >
                                        {hour.toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>

                            {WEEKDAYS.map((day, dateIndex) => (
                                <div
                                    key={day}
                                    className="flex flex-col overflow-hidden rounded-b-md border-2 border-[#0f692b]"
                                >
                                    {HOURS.map((hour, idx) => {
                                        const reserved = isReserved(dateIndex, hour);
                                        const start = isReservationStart(dateIndex, hour);
                                        return (
                                            <div
                                                key={hour}
                                                className={[
                                                    'relative flex min-h-[32px] items-center border-t border-[#0f692b] text-xs',
                                                    idx === 0 ? 'border-t-0' : '',
                                                    reserved ? 'bg-[#f8d9f2]' : 'bg-white',
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            >
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

                    <div className="md:hidden rounded-xl bg-white p-1 max-h-[60vh] overflow-y-auto">
                        <div className="flex gap-1 min-w-max">
                            <div className="flex flex-col w-8 flex-shrink-0">
                                <div className="h-6 flex items-center justify-center" />
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className="flex min-h-[24px] items-center justify-center text-[8px] font-medium text-gray-500"
                                    >
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1">
                                <div className="rounded-t-lg border-2 border-[#0f692b] border-b-0 py-0.5 text-center bg-[#0f692b]">
                                    <div className="text-[10px] font-bold text-white">
                                        {WEEKDAYS[currentDayIndex]}
                                    </div>
                                </div>

                                <div className="flex flex-col rounded-b-lg border-2 border-[#0f692b] overflow-hidden">
                                    {HOURS.map((hour, idx) => {
                                        const reserved = isReserved(currentDayIndex, hour);
                                        const start = isReservationStart(currentDayIndex, hour);
                                        return (
                                            <div
                                                key={hour}
                                                className={[
                                                    'relative flex min-h-[24px] items-center justify-center border-t border-[#0f692b]',
                                                    idx === 0 ? 'border-t-0' : '',
                                                    reserved ? 'bg-[#f8d9f2]' : 'bg-white',
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            >
                                                {start && (
                                                    <span className="text-[8px] font-semibold text-[#a3158f]">
                                                        Reserviert
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {role === 'admin' && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed right-0 top-1/5 translate-x-1 z-50 w-20 h-24 bg-[#dfeedd] border-2 border-green-700 rounded-l-4xl flex flex-col items-center justify-center text-green-700 text-xl shadow-lg hover:bg-[#b4cfb3] transition-colors"
                >
                    <span className="w-8 h-1 bg-green-700 rounded-full mb-1" />
                    <span className="w-8 h-1 bg-green-700 rounded-full mb-1" />
                    <span className="w-8 h-1 bg-green-700 rounded-full" />
                </button>
            )}

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-4">
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="self-end mb-4 text-[#0f692b] font-bold text-xl"
                    >
                        ✕
                    </button>

                    <h2 className="text-lg font-semibold text-[#0f692b] mb-4">Kalenderverwaltung</h2>
                    <button onClick={() => setShowPopup(true)}
                        className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Anfragen verwalten
                    </button>
                    <button onClick={() => setShowBlockPopup(true)}
                        className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Tag/Zeitslots sperren
                    </button>

                </div>
            </div>
            {showPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md min-h-[600px] max-h-[80vh] flex flex-col">
                        <h2 className="text-2xl font-bold text-[#0f692b] text-center mb-6">Anfragen verwalten</h2>

                        <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
                            {/* Hier DB-Daten einfügen */}
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        {showBlockPopup && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Tage / Zeitslots sperren</h2>
                <button
                    onClick={() => setShowBlockPopup(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    aria-label="Schließen"
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div className="px-5 py-6 space-y-4">

                {/* Raum */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Raum
                    </label>
                    <select
                        value={blockRoomId}
                        onChange={(e) => setBlockRoomId(Number(e.target.value))}
                        className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 
                                   text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                    >
                        {ROOMS.map((room) => (
                            <option key={room.room_id} value={room.room_id}>
                                {room.room_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Datum */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Datum
                    </label>
                    <input
                        type="date"
                        value={blockDate}
                        onChange={(e) => setBlockDate(e.target.value)}
                        className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 
                                   text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                    />
                </div>

                {/* Ganzer Tag Checkbox */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="block-all-day"
                        checked={blockAllDay}
                        onChange={() => setBlockAllDay(!blockAllDay)}
                     className="w-5 h-5 accent-[#0f692b] cursor-pointer"
                    />
                    <label htmlFor="block-all-day" className="text-sm font-medium text-gray-700">
                        Ganzer Tag sperren
                    </label>
                </div>

                {/* Von / Bis – nur sichtbar wenn nicht ganzer Tag */}
                {!blockAllDay && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Von
                            </label>
                            <select
                                value={blockStart}
                                onChange={(e) => setBlockStart(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 
                                           text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                            >
                                {TIME_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Bis
                            </label>
                            <select
                                value={blockEnd}
                                onChange={(e) => setBlockEnd(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 
                                           text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                            >
                                {TIME_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl flex justify-center">
                <button
                    onClick={handleBlockSubmit}
                    className="px-8 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold 
                               hover:bg-[#0a4d1f] transition-colors"
                >
                    Slot sperren
                </button>
            </div>
        </div>
    </div>
)}

        </>)
}