'use client';

import { useState, useMemo, useEffect } from 'react';

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
const WEEKDAYS: Weekday[] = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
];

const ROOMS = [
    { room_id: 1, room_name: 'Raum 1' },
    { room_id: 2, room_name: 'Raum 2' }
];

// Generate time options from 8:00 to 20:00 in 30-minute steps
const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

// const MOCK_TIMESLOTS: Timeslot[] = [
//     { timeslot_id: 1, room_id: 1, status: 1, slot_date: '2025-11-18', start_time: '14:00:00', end_time: '17:00:00', name: 'Team Meeting' },
//     { timeslot_id: 2, room_id: 1, status: 1, slot_date: '2025-11-20', start_time: '09:00:00', end_time: '12:00:00', name: 'Project Review' },
//     { timeslot_id: 3, room_id: 2, status: 1, slot_date: '2025-11-19', start_time: '10:00:00', end_time: '13:00:00', name: 'Client Presentation' },
//     { timeslot_id: 4, room_id: 1, status: 1, slot_date: '2025-11-25', start_time: '11:00:00', end_time: '14:00:00', name: 'Workshop' },
//     { timeslot_id: 5, room_id: 2, status: 1, slot_date: '2025-11-27', start_time: '15:00:00', end_time: '18:00:00', name: 'Training' },
//     { timeslot_id: 6, room_id: 1, status: 1, slot_date: '2025-11-11', start_time: '08:00:00', end_time: '11:00:00', name: 'Planning Session' },
// ];


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

    return `${monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${friday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getHourFromTime(timeStr: string): number {
    return parseInt(timeStr.split(':')[0], 10);
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTimeForDisplay(timeStr: string): string {
    return timeStr.substring(0, 5); // Remove seconds if present
}

export default function RoomsPage() {
    const [role, setRole] = useState<Role>('guest');
    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

    // Admin sidebar states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showRequestsPopup, setRequestsShowPopup] = useState(false);
    const [showBlockPopup, setShowBlockPopup] = useState(false);

    // Block popup states
    const [blockRoomId, setBlockRoomId] = useState(1);
    const [blockDate, setBlockDate] = useState('');
    const [blockAllDay, setBlockAllDay] = useState(false);
    const [blockStart, setBlockStart] = useState('08:00');
    const [blockEnd, setBlockEnd] = useState('20:00');

    // Booking popup states
    const [openBooking, setOpenBooking] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [timeError, setTimeError] = useState('');
    const [reasonError, setReasonError] = useState('');
    
    // Booking list popup state
    const [openBookingList, setOpenBookingList] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const storedRole = (localStorage.getItem('userRole') as Role) || 'guest';

            console.log('Current Auth State from LocalStorage:', {isLoggedIn, storedRole});

            if (!isLoggedIn) setRole('guest');
            else if (storedRole === 'admin') setRole('admin');
            else setRole('user');
        }
    }, []);

    useEffect(() => {
        if (!selectedRoomId) return;

        const fetchTimeslots = async () => {
            try {
                const res = await fetch(`/api/calendar?room_id=${selectedRoomId}`);

                if (!res.ok) {
                    throw new Error(`HTTP-Fehler! Status: ${res.status}`);
                }

                const text = await res.text();
                const data = text ? JSON.parse(text) : [];

                setTimeslots(data);
            } catch (err) {
                console.error('Fehler beim Laden der Timeslots:', err);
                setTimeslots([]);
            }
        };

        fetchTimeslots();
    }, [selectedRoomId]);

    useEffect(() => {
        const today = new Date();
        const index = today.getDay() - 1;

        if (index >= 0 && index < 4) {
            setCurrentDayIndex(index);
        }
    }, []);

    // Function to open popup on cell click
    const handleCellClick = (dateIndex: number, hour: number) => {
        if (role !== 'user') return;

        if (isReserved(dateIndex, hour)) return;

        const date = toISODate(weekDates[dateIndex]);
        setSelectedDate(date);
        setSelectedHour(hour);
        setStartTime(`${hour.toString().padStart(2, '0')}:00`);
        setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
        setReason('');
        setTimeError('');
        setReasonError('');
        setOpenBooking(true);
    };

    const handleStartTimeChange = (newStartTime: string) => {
        setStartTime(newStartTime);
        setTimeError('');

        // If end time is before or equal to start time, set it to start time
        if (timeToMinutes(endTime) <= timeToMinutes(newStartTime)) {
            setEndTime(newStartTime);
        }
    };

    const handleReset = () => {
        setSelectedRoomId(1);
        setSelectedDate('');
        setStartTime('08:00');
        setEndTime('08:00');
        setReason('');
        setTimeError('');
        setReasonError('');
    };

    const handleBookingSubmit = async () => {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const duration = endMinutes - startMinutes;

        setTimeError('');
        setReasonError('');

        let hasError = false;

        if (duration < 30) {
            setTimeError('Die Buchung muss mindestens 30 Minuten dauern.');
            hasError = true;
        }

        if (!reason.trim()) {
            setReasonError('Bitte geben Sie einen Grund für die Buchung an.');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        const res = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: 1, // Später aus Auth holen
                room_id: selectedRoomId,
                slot_date: selectedDate,
                start_time: startTime,
                end_time: endTime,
                reason
            })
        });

        const data = await res.json();
        if (!res.ok) {
            setTimeError(data.message || 'Fehler beim Buchen.');
            return;
        }

        alert(`Buchung erfolgreich! ID: ${data.booking_id}`);
        setOpenBooking(false);

        // Timeslots neu laden
        fetch(`/api/calendar?room_id=${selectedRoomId}`)
            .then(res => res.json())
            .then(data => setTimeslots(data))
            .catch(err => console.error('Fehler beim Laden der Timeslots:', err));
    };

    // Function to delete a booking
    const handleDeleteBooking = async (timeslotId: number) => {
        // In a real app, you would make an API call here
        await fetch(`/api/calendar?room_id=${selectedRoomId}`)
            .then(res => res.json())
            .then(data => setTimeslots(data));

        // For demo purposes, we'll just log the action
        alert(`Buchung mit ID ${timeslotId} würde gelöscht werden.`);

        // In a real implementation, you would update the MOCK_TIMESLOTS array
        // or make an API call to delete the booking
    };

    const handleBlockSubmit = () => {
        console.log('Admin Blocking:', {
            room: blockRoomId,
            date: blockDate,
            allDay: blockAllDay,
            from: blockStart,
            to: blockEnd
        });

        setShowBlockPopup(false);
    };

    const weekDates = useMemo(() => {
        return WEEKDAYS.map((_, index) => {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + index);
            return date;
        });
    }, [currentWeekStart]);

    const timeslotsForRoom = useMemo(
        () => timeslots.filter((t) => t.room_id === selectedRoomId),
        [timeslots, selectedRoomId]
    );

    // Get user's bookings
    const userBookings = useMemo(() => {
        return timeslots
            .filter((booking) => booking.status === 1) // Only confirmed bookings
            .sort((a, b) => {
                // Sort by date and time
                const dateCompare = a.slot_date.localeCompare(b.slot_date);
                if (dateCompare !== 0) return dateCompare;
                return a.start_time.localeCompare(b.start_time);
            });
    }, [timeslots]);

    const isCurrentWeek = useMemo(() => {
        const todayMonday = getMonday(new Date());
        return currentWeekStart.toDateString() === todayMonday.toDateString();
    }, [currentWeekStart]);

    const showMobileTodayButton = useMemo(() => {
        if (!isCurrentWeek) return true;

        const today = new Date();
        const currentRealDayIndex = today.getDay() - 1;

        return currentDayIndex !== currentRealDayIndex;
    }, [isCurrentWeek, currentDayIndex]);

    // Get available end times based on start time
    const availableEndTimes = useMemo(() => {
        const startMinutes = timeToMinutes(startTime);
        return TIME_OPTIONS.filter(time => timeToMinutes(time) >= startMinutes);
    }, [startTime]);

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
        const today = new Date();

        setCurrentWeekStart(getMonday(today));

        const dayIndex = today.getDay() - 1;

        setCurrentDayIndex(dayIndex >= 0 && dayIndex < 4 ? dayIndex : 0);
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

    return (
        <>
            <main className="flex justify-center px-2 pt-25 md:px-4 pt-20 md:pt-35 pb-2 md:pb-10">
                <div className="w-full max-w-5xl rounded-2xl md:rounded-3xl bg-[#dfeedd] px-2 md:px-8 pb-2 md:pb-10 pt-2 md:pt-8 shadow-xl">
                    <div className="mb-2 md:mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-4">
                        <div className="flex gap-2 w-full md:w-auto">
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

                            {/* Booking List Button - nur für User */}
                            {role === 'user' && (
                                <button
                                    onClick={() => setOpenBookingList(true)}
                                    className="rounded-xl border border-[#0f692b] bg-white px-3 py-1 text-sm text-[#0f692b] font-semibold hover:bg-[#0f692b] hover:text-white transition-colors flex items-center gap-1.5"
                                    aria-label="Meine Buchungen anzeigen"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <span className="hidden md:inline">Meine Buchungen</span>
                                    <span className="md:hidden">Buchungen</span>
                                </button>
                            )}
                        </div>

                        {/*Desktop Navigation Structure*/}
                        <div className=" hidden md:flex items-center gap-3">
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

                    {/*Mobile Navigation Structure*/}
                    <div className="flex md:hidden items-center gap-1.5 w-full pb-2">
                        <button
                            onClick={goToPreviousDay}
                            className="rounded-lg bg-white border-2 border-[#0f692b] px-2 py-1 text-[#0f692b] text-sm font-semibold hover:bg-[#0f692b] hover:text-white transition-colors flex-shrink-0"
                            aria-label="Vorheriger Tag"
                        >
                            ←
                        </button>

                        <div className="text-center flex-1 min-w-0">
                            <div className="text-[15px] font-bold text-[#0f692b] truncate">
                                {formatFullDate(weekDates[currentDayIndex])}
                            </div>
                            {showMobileTodayButton && (
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

                    {/*Desktop Calendar Structure*/}
                    <div className="hidden md:block rounded-2xl bg-white px-5 pb-6 pt-5">
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
                                            <div
                                                key={hour}
                                                onClick={() => handleCellClick(dateIndex, hour)}
                                                className={[
                                                    'relative flex min-h-[32px] items-center border-t border-[#0f692b] text-xs',
                                                    idx === 0 ? 'border-t-0' : '',
                                                    reserved ? 'bg-[#f8d9f2]' : 'bg-white',
                                                    !reserved && role === 'user' ? 'cursor-pointer hover:bg-[#e6f5e9]' : '',
                                                ].filter(Boolean).join(' ')}
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

                    {/* Mobile Daily View */}
                    <div className="md:hidden rounded-xl bg-white p-1 max-h-[80vh] overflow-y-auto">
                        <div className="flex gap-1 min-w-max">
                            <div className="flex flex-col w-8 flex-shrink-0">
                                <div className="h-6 flex items-center justify-center"></div>
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className="flex min-h-[38.5px] items-center justify-center text-[8px] font-semibold text-gray-500"
                                    >
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1">
                                

                                <div className="flex flex-col rounded-lg border-2 border-[#0f692b] overflow-hidden">
                                    {HOURS.map((hour, idx) => {
                                        const reserved = isReserved(currentDayIndex, hour);
                                        const start = isReservationStart(currentDayIndex, hour);
                                        return (
                                            <div
                                                key={hour}
                                                onClick={() => handleCellClick(currentDayIndex, hour)}
                                                className={[
                                                    'relative flex min-h-[40px] items-center justify-center border-t border-[#0f692b]',
                                                    idx === 0 ? 'border-t-0' : '',
                                                    reserved ? 'bg-[#f8d9f2]' : 'bg-white',
                                                    !reserved && role === 'user' ? 'cursor-pointer hover:bg-[#e6f5e9]' : '',
                                                ].filter(Boolean).join(' ')}
                                            >
                                                {start && (
                                                    <span className="text-[10px] font-semibold text-[#a3158f]">
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
                    <button onClick={() => setRequestsShowPopup(true)}
                        className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Anfragen verwalten
                    </button>
                    <button onClick={() => setShowBlockPopup(true)}
                        className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Tag/Zeitslots sperren
                    </button>

                </div>
            </div>

            {/* Booking Popup */}
            {openBooking && role === 'user' && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Raum buchen</h2>
                            <button
                                onClick={() => setOpenBooking(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                aria-label="Schließen"
                            >
                                ×
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="px-5 py-6 space-y-4">
                            {/* Raum dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Raum
                                </label>
                                <select
                                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                                >
                                    {ROOMS.map((room) => (
                                        <option key={room.room_id} value={room.room_id}>
                                            {room.room_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Datum input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Datum
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate || ''}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                />
                            </div>

                            {/* Von / Bis time dropdowns */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Von
                                    </label>
                                    <select
                                        value={startTime}
                                        onChange={(e) => handleStartTimeChange(e.target.value)}
                                        className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                    >
                                        {TIME_OPTIONS.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Bis
                                    </label>
                                    <select
                                        value={endTime}
                                        onChange={(e) => {
                                            setEndTime(e.target.value);
                                            setTimeError('');
                                        }}
                                        className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                    >
                                        {availableEndTimes.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Time Error message */}
                            {timeError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {timeError}
                                </div>
                            )}

                            {/* Grund textarea */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Grund
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        setReasonError('');
                                    }}
                                    rows={3}
                                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#0f692b]"
                                    placeholder="Grund für die Buchung..."
                                />
                            </div>

                            {/* Reason Error message */}
                            {reasonError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {reasonError}
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl flex gap-3 justify-end">
                            <button
                                onClick={handleReset}
                                className="px-6 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold hover:bg-[#0a4d1f] transition-colors"
                            >
                                Zurücksetzen
                            </button>
                            <button
                                onClick={handleBookingSubmit}
                                className="px-6 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold hover:bg-[#0a4d1f] transition-colors"
                            >
                                Absenden
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking List Popup */}
            {openBookingList && role === 'user' && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Meine Buchungen</h2>
                            <button
                                onClick={() => setOpenBookingList(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                aria-label="Schließen"
                            >
                                ×
                            </button>
                        </div>

                        {/* Bookings List */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {userBookings.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Sie haben noch keine Buchungen.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userBookings.map((booking) => (
                                        <div
                                            key={booking.timeslot_id}
                                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-gray-800">
                                                            {ROOMS.find(r => r.room_id === booking.room_id)?.room_name}
                                                        </span>
                                                        <span className="text-xs bg-[#dfeedd] text-[#0f692b] px-2 py-1 rounded-full font-medium">
                                                            Bestätigt
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        <span className="font-medium">
                                                            {new Date(booking.slot_date).toLocaleDateString('de-DE', {
                                                                weekday: 'long',
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        <span className="font-medium">Uhrzeit:</span> {formatTimeForDisplay(booking.start_time)} - {formatTimeForDisplay(booking.end_time)} Uhr
                                                    </div>
                                                    {booking.name && (
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Grund:</span> {booking.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBooking(booking.timeslot_id)}
                                                    className="ml-4 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                                                    aria-label="Buchung löschen"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Löschen
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl border-t border-gray-200">
                            <div className="text-sm text-gray-600 text-center">
                                Gesamt: {userBookings.length} Buchung{userBookings.length !== 1 ? 'en' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Requests Popup */}
            {showRequestsPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md min-h-[600px] max-h-[80vh] flex flex-col">
                        <h2 className="text-2xl font-bold text-[#0f692b] text-center mb-6">Anfragen verwalten</h2>

                        <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
                            {/* Hier DB-Daten einfügen */}
                        </div>

                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl flex justify-center">
                            <button
                                onClick={() => setRequestsShowPopup(false)}
                                className="px-8 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold 
                                           hover:bg-[#0a4d1f] transition-colors"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Popup */}
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
        </>
    );
}