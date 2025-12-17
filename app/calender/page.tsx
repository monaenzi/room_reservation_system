'use client';

import { useState, useMemo, useEffect } from 'react';

type Role = 'guest' | 'user' | 'admin';
type Weekday = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';

type Timeslot = {
    timeslot_id: number;
    room_id: number;
    timeslot_status: number;
    slot_date: string | Date;
    start_time: string
    end_time: string;
    blocked_reason?: string;
    name?: string;
    booking_status?: number;
    user_id?: number;
    username?: string;
};



type BookingRequest = {
    booking_id: number;
    user_id: number;
    timeslot_id: number;
    reason: string;
    booking_status: number;
    room_id: number;
    slot_date: string;
    start_time: string;
    end_time: string;
    timeslot_status: number;
    username: string;
    room_name: string;
};

// NEU: Type für User-Buchungen
type UserBooking = {
    booking_id: number;
    user_id: number;
    timeslot_id: number;
    reason: string;
    booking_status: number; // 0=pending, 1=accepted, 2=declined
    room_id: number;
    slot_date: string;
    start_time: string;
    end_time: string;
    timeslot_status: number;
    room_name: string;
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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


function normalizeSlotDate(dbDate: string | Date): string {
    if (!dbDate) return "";
    if (dbDate instanceof Date) {
        return dbDate.toISOString().split("T")[0];
    }
    // ISO-String oder nur "YYYY-MM-DD"
    return dbDate.split("T")[0];
}


function getBookingStatusText(status: number): string {
    switch (status) {
        case 0: return 'Ausstehend';
        case 1: return 'Bestätigt';
        case 2: return 'Abgelehnt';
        default: return 'Unbekannt';
    }
}

function getBookingStatusColor(status: number): string {
    switch (status) {
        case 0: return 'bg-yellow-100 text-yellow-800';
        case 1: return 'bg-green-100 text-green-800';
        case 2: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export default function RoomsPage() {
    const [role, setRole] = useState<Role>('guest');
    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

    const [adminRequests, setAdminRequests] = useState<BookingRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

    // NEU: States für User-Buchungen
    const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
    const [isLoadingUserBookings, setIsLoadingUserBookings] = useState(false);

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

    // NEU: Aktuelle User-ID (in echtem Projekt aus Auth holen)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const storedRole = (localStorage.getItem('userRole') as Role) || 'guest';
            const storedUserId = localStorage.getItem('userId');

            console.log('Current Auth State from LocalStorage:', { isLoggedIn, storedRole, storedUserId });

            if (!isLoggedIn) {
                setRole('guest');
                setCurrentUserId(null);
            } else {
                if (storedRole === 'admin') setRole('admin');
                else setRole('user');

                if (storedUserId) {
                    const parsed = parseInt(storedUserId, 10);
                    if (!isNaN(parsed)) {
                        setCurrentUserId(parsed);
                    } else {
                        console.warn("Calendar: storedUserID ist keineZahl: ", storedUserId);
                        setCurrentUserId(null);
                    }
                } else {
                    console.warn("Calendar: Keine userId im LocalStorage gefunden.");
                    setCurrentUserId(null);
                }
            }
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

    // NEU: Funktion zum Laden der User-Buchungen
    const loadUserBookings = async () => {
        if (role !== 'admin' && role !== 'user' || !currentUserId) return; //liste von Buchungen für admin wird jetzt gezeigt

        setIsLoadingUserBookings(true);
        try {
            const res = await fetch(`/api/calendar?user_id=${currentUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) throw new Error('Fehler beim Laden der Buchungen');
            const data = await res.json();
            setUserBookings(data);
        } catch (err) {
            console.error('Fehler beim Laden der User-Buchungen:', err);
            alert('Fehler beim Laden der Buchungen');
        } finally {
            setIsLoadingUserBookings(false);
        }
    };

    // NEU: "Meine Buchungen" Popup öffnen (mit Daten laden)
    const handleOpenBookingList = () => {
        loadUserBookings();
        setOpenBookingList(true);
    };

    // Function to open popup on cell click
    const handleCellClick = (dateIndex: number, hour: number) => {
        if (role !== 'user' && role !== 'admin') return;

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

 //   const handleReset = () => {
 //       setSelectedRoomId(1);
 //       setSelectedDate('');
 //       setStartTime('08:00');
 //       setEndTime('08:00');
 //       setReason('');
 //       setTimeError('');
 //       setReasonError('');
 //   };

    const handleBookingSubmit = async () => {
        console.log("handleBookingSubmit:currenUserId= ", currentUserId);

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const duration = endMinutes - startMinutes;

        setTimeError('');
        setReasonError('');



        if (!currentUserId) {
            setReasonError('Fehler: keine Benutzer-ID gefunden. Bitte neu einloggen.');
            console.error('Booking abgebrochen: currentUserId ist null/undefined.');
            return;
        }

        let hasError = false;

        if (duration < 30) {
            setTimeError('Die Buchung muss mindestens 30 Minuten dauern.');
            hasError = true;
        }

        if (endMinutes > 20 * 60) {
            setTimeError('Buchungen sind nur bis 20:00 Uhr möglich.');
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
                user_id: currentUserId,
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

    // NEU: Funktion zum Löschen einer Buchung (für User)
    const handleDeleteBooking = async (bookingId: number) => {
        if (!confirm('Möchten Sie diese Buchung wirklich löschen?')) {
            return;
        }

        try {
            const res = await fetch(`/api/calendar?booking_id=${bookingId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Fehler beim Löschen');
            }

            alert('Buchung erfolgreich gelöscht!');

            // Buchungsliste neu laden
            loadUserBookings();

            // Timeslots für aktuellen Raum neu laden
            if (selectedRoomId) {
                const timeslotsRes = await fetch(`/api/calendar?room_id=${selectedRoomId}`);
                const timeslotsData = await timeslotsRes.json();
                setTimeslots(timeslotsData);
            }

        } catch (err) {
            console.error('Fehler beim Löschen:', err);
            alert(err instanceof Error ? err.message : 'Fehler beim Löschen');
        }
    };

    const handleBlockSubmit = async () => {
        if (!blockDate) {
            alert('Bitte wählen Sie ein Datum aus.');
            return;
        }

        // Validation
        const startMinutes = timeToMinutes(blockAllDay ? '08:00' : blockStart);
        const endMinutes = timeToMinutes(blockAllDay ? '20:00' : blockEnd);

        if (endMinutes <= startMinutes) {
            alert('Endzeit muss nach der Startzeit liegen.');
            return;
        }

        try {
            const res = await fetch('/api/calendar', {
                method: 'PATCH', // Wichtig: PATCH statt POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: blockRoomId,
                    slot_date: blockDate,
                    start_time: blockAllDay ? '08:00' : blockStart,
                    end_time: blockAllDay ? '20:00' : blockEnd,
                    reason: blockAllDay ? 'Ganzer Tag gesperrt' : 'Zeitslot gesperrt'
                })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || 'Fehler beim Sperren.');
                return;
            }

            alert(`Slot erfolgreich gesperrt! ID: ${data.timeslot_id}`);
            setShowBlockPopup(false);

            // Timeslots neu laden
            fetch(`/api/calendar?room_id=${selectedRoomId}`)
                .then(res => res.json())
                .then(data => setTimeslots(data))
                .catch(err => console.error('Fehler beim Laden der Timeslots:', err));

        } catch (err) {
            console.error('Fehler beim Sperren:', err);
            alert('Fehler beim Sperren des Slots.');
        }
    };

    // Funktion zum Laden der Admin-Anfragen
    const loadAdminRequests = async () => {
        setIsLoadingRequests(true);
        try {
            const res = await fetch('/api/calendar?action=admin-requests', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) throw new Error('Fehler beim Laden der Anfragen');
            const data = await res.json();
            setAdminRequests(data);
        } catch (err) {
            console.error('Fehler beim Laden der Admin-Anfragen:', err);
            alert('Fehler beim Laden der Anfragen');
        } finally {
            setIsLoadingRequests(false);
        }
    };

    // Admin-Requests-Popup öffnen (mit Daten laden)
    const handleOpenRequestsPopup = () => {
        loadAdminRequests();
        setRequestsShowPopup(true);
    };

    // Funktion zum Annehmen/Ablehnen von Buchungen
    const handleAdminAction = async (bookingId: number, action: 'accept' | 'reject') => {
        if (!confirm(`Möchten Sie diese Buchung wirklich ${action === 'accept' ? 'annehmen' : 'ablehnen'}?`)) {
            return;
        }

        try {
            const res = await fetch('/api/calendar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId, action })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Fehler bei der Aktion');
            }

            // Liste neu laden
            loadAdminRequests();

            // Timeslots für aktuellen Raum neu laden
            if (selectedRoomId) {
                const timeslotsRes = await fetch(`/api/calendar?room_id=${selectedRoomId}`);
                const timeslotsData = await timeslotsRes.json();
                setTimeslots(timeslotsData);
            }

        } catch (err) {
            console.error('Fehler bei Admin-Aktion:', err);
            alert(err instanceof Error ? err.message : 'Fehler bei der Aktion');
        }
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

    const getTimeslotForCell = (dateIndex: number, hour: number): Timeslot | undefined => {
        const dateStr = toISODate(weekDates[dateIndex]); // "YYYY-MM-DD"

        return timeslotsForRoom.find((t) => {
            const slotDateStr = normalizeSlotDate(t.slot_date);
            if (slotDateStr !== dateStr) return false;

            const startHour = getHourFromTime(t.start_time);
            const endHour = getHourFromTime(t.end_time);

            return hour >= startHour && hour < endHour;
        });
    };


    function getSlotForCell(
        timeslots: Timeslot[],
        weekDates: Date[],
        dateIndex: number,
        hour: number
    ): Timeslot | undefined {
        const dateStr = toISODate(weekDates[dateIndex]);

        return timeslots.find((t) => {
            if (t.slot_date !== dateStr) return false;
            const startHour = getHourFromTime(t.start_time);
            const endHour = getHourFromTime(t.end_time);
            return hour >= startHour && hour < endHour;
        });
    }


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
            const slotDateStr = normalizeSlotDate(t.slot_date);
            if (slotDateStr !== dateStr) return false;

            const startHour = getHourFromTime(t.start_time);
            const endHour = getHourFromTime(t.end_time);

            if (hour >= startHour && hour < endHour) {
                return t.booking_status === 1; // bestätigt
            }
            return false;
        });
    };

    const isReservationStart = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);

        return timeslotsForRoom.some((t) => {
            const slotDateStr = normalizeSlotDate(t.slot_date);
            if (slotDateStr !== dateStr) return false;

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
                            {(role === 'user' || role === 'admin') && (
                                <button
                                    onClick={handleOpenBookingList} // NEU: handleOpenBookingList verwenden
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
                                        const slot = getTimeslotForCell(dateIndex, hour);
                                        const reserved = !!slot && (slot.timeslot_status === 2 || slot.timeslot_status === 3);
                                        const start = !!slot && isReservationStart(dateIndex, hour);

                                        const classNames = [
                                            "relative flex min-h-[32px] items-center border-t border-[#0f692b] text-xs",
                                            idx === 0 ? "border-t-0" : "",
                                        ];

                                        if (reserved) {
                                            if (slot?.timeslot_status === 3) {
                                                // gesperrt durch Admin
                                                classNames.push("bg-gray-300 text-gray-800");
                                            } else if (slot?.booking_status === 0) {
                                                // pending
                                                classNames.push("bg-orange-200 text-orange-900");
                                            } else if (slot?.booking_status === 1) {
                                                // bestätigt
                                                classNames.push("bg-green-200 text-green-900");
                                            } else {
                                                classNames.push("bg-gray-100");
                                            }
                                        } else {
                                            classNames.push("bg-white");
                                            if (role === "user" || role === "admin") {
                                                classNames.push("cursor-pointer", "hover:bg-[#e6f5e9]");
                                            }
                                        }

                                        return (
                                            <div
                                                key={hour}
                                                onClick={() => handleCellClick(dateIndex, hour)}
                                                className={classNames.filter(Boolean).join(" ")}
                                            >
                                                {start && slot && (
                                                    <div className="absolute inset-x-1 top-1 flex flex-col items-center text-[10px] font-semibold">
                                                        {/* Username anzeigen */}
                                                        <span>{slot.username || "Belegt"}</span>
                                                        {/* optional Text je nach Status */}
                                                        {slot.timeslot_status === 3 && (
                                                            <span className="text-[9px] font-normal">Gesperrt</span>
                                                        )}
                                                        {slot.timeslot_status === 2 && slot.booking_status === 0 && (
                                                            <span className="text-[9px] font-normal">Anfrage</span>
                                                        )}
                                                        {slot.timeslot_status === 2 && slot.booking_status === 1 && (
                                                            <span className="text-[9px] font-normal">Bestätigt</span>
                                                        )}
                                                    </div>
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
                                        const slot = getTimeslotForCell(currentDayIndex, hour);
                                        const reserved = !!slot && (slot.timeslot_status === 2 || slot.timeslot_status === 3);
                                        const start = !!slot && isReservationStart(currentDayIndex, hour);

                                        const classNames = [
                                            "relative flex min-h-[40px] items-center justify-center border-t border-[#0f692b]",
                                            idx === 0 ? "border-t-0" : "",
                                        ];

                                        if (reserved) {
                                            if (slot?.timeslot_status === 3) {
                                                classNames.push("bg-gray-300 text-gray-800");
                                            } else if (slot?.booking_status === 0) {
                                                classNames.push("bg-orange-200 text-orange-900");
                                            } else if (slot?.booking_status === 1) {
                                                classNames.push("bg-green-200 text-green-900");
                                            } else {
                                                classNames.push("bg-gray-100");
                                            }
                                        } else {
                                            classNames.push("bg-white");
                                            if (role === "user" || role === "admin") {
                                                classNames.push("cursor-pointer", "hover:bg-[#e6f5e9]");
                                            }
                                        }

                                        return (
                                            <div
                                                key={hour}
                                                onClick={() => handleCellClick(currentDayIndex, hour)}
                                                className={classNames.filter(Boolean).join(" ")}
                                            >
                                                {start && slot && (
                                                    <div className="flex flex-col items-center text-[10px] font-semibold">
                                                        <span>{slot.username || "Belegt"}</span>
                                                        {slot.timeslot_status === 3 && (
                                                            <span className="text-[9px] font-normal">Gesperrt</span>
                                                        )}
                                                        {slot.timeslot_status === 2 && slot.booking_status === 0 && (
                                                            <span className="text-[9px] font-normal">Anfrage</span>
                                                        )}
                                                        {slot.timeslot_status === 2 && slot.booking_status === 1 && (
                                                            <span className="text-[9px] font-normal">Bestätigt</span>
                                                        )}
                                                    </div>
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
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`fixed top-1/3 sm:top-1/5 z-50 w-14 h-16 sm:w-20 sm:h-24
            bg-[#dfeedd] border-2 border-green-700 rounded-l-2xl sm:rounded-l-4xl
            flex flex-col items-center justify-center text-green-700 text-xl
            shadow-lg hover:bg-[#b4cfb3] transition-all duration-300
            ${isSidebarOpen
                            ? 'right-[75vw] sm:right-80 translate-x-0'
                            : 'right-0 translate-x-1'
                        }
        `}
                >
                    {isSidebarOpen ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <span className="text-3xl font-bold text-green-700">➜</span>
                        </div>


                    ) : (
                        <>
                            <span className="w-6 h-1 sm:w-8 bg-green-700 rounded-full mb-1" />
                            <span className="w-6 h-1 sm:w-8 bg-green-700 rounded-full mb-1" />
                            <span className="w-6 h-1 sm:w-8 bg-green-700 rounded-full" />
                        </>
                    )}
                </button>
            )}

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div
                className={`fixed top-0 right-0 h-full w-[75vw] sm:w-80 bg-white shadow-xl transform transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-4">



                    <h2 className="text-lg font-semibold text-[#0f692b] mb-4">Kalenderverwaltung</h2>
                    <button onClick={() => {
                        handleOpenRequestsPopup();
                        setIsSidebarOpen(false);
                    }}
                        className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Anfragen verwalten
                    </button>
                    <button onClick={() => {
                        setShowBlockPopup(true);
                        setIsSidebarOpen(false);
                    }}
                        className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Tag/Zeitslots sperren
                    </button>

                </div>
            </div>

            {/* Booking Popup */}
            {openBooking && (role === 'user' || role === 'admin') && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
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
                                onClick={() => setOpenBooking(false)}
                                className="px-6 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold hover:bg-[#0a4d1f] transition-colors"
                            >
                                Abbrechen
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

            {openBookingList && (role === 'admin' || role === 'user') && ( //liste von Buchungen für admin wird jetzt gezeigt
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
                            {isLoadingUserBookings ? (
                                <div className="text-center py-8 text-gray-500">
                                    Lade Buchungen...
                                </div>
                            ) : userBookings.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Sie haben noch keine Buchungen.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {userBookings.map((booking) => (
                                        <div
                                            key={booking.booking_id}
                                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-lg text-gray-800">
                                                            {booking.room_name}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBookingStatusColor(booking.booking_status)}`}>
                                                            {getBookingStatusText(booking.booking_status)}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-500">Datum</div>
                                                            <div className="text-sm text-gray-800">
                                                                {new Date(booking.slot_date).toLocaleDateString('de-DE', {
                                                                    weekday: 'long',
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-500">Zeit</div>
                                                            <div className="text-sm text-gray-800">
                                                                {formatTimeForDisplay(booking.start_time)} - {formatTimeForDisplay(booking.end_time)} Uhr
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-500">Buchungs-ID</div>
                                                            <div className="text-sm text-gray-800">#{booking.booking_id}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-500">Raum-ID</div>
                                                            <div className="text-sm text-gray-800">{booking.room_id}</div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Grund</div>
                                                        <div className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                                                            {booking.reason}
                                                        </div>
                                                    </div>
                                                </div>

                                                {booking.booking_status === 0 && (
                                                    <button
                                                        onClick={() => handleDeleteBooking(booking.booking_id)}
                                                        className="ml-4 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                                                        aria-label="Buchung löschen"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Löschen
                                                    </button>
                                                )}
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md min-h-[600px] max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Anfragen verwalten</h2>
                            <button
                                onClick={() => setRequestsShowPopup(false)}
                                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                                aria-label="Schließen"
                            >
                                ×
                            </button>
                        </div>

                        {isLoadingRequests ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-gray-500">Lade Anfragen...</div>
                            </div>
                        ) : adminRequests.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-gray-500">Keine ausstehenden Anfragen</div>
                            </div>
                        ) : (
                            <div className="space-y-4 p-6 overflow-y-auto pr-2">
                                {adminRequests.map((request) => (
                                    <div
                                        key={request.booking_id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="font-semibold text-lg text-gray-800">
                                                        {request.room_name}
                                                    </span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                                        Ausstehend
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Benutzer</div>
                                                        <div className="text-sm text-gray-800">{request.username}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Datum</div>
                                                        <div className="text-sm text-gray-800">
                                                            {new Date(request.slot_date).toLocaleDateString('de-DE', {
                                                                weekday: 'long',
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Zeit</div>
                                                        <div className="text-sm text-gray-800">
                                                            {formatTimeForDisplay(request.start_time)} - {formatTimeForDisplay(request.end_time)} Uhr
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Buchungs-ID</div>
                                                        <div className="text-sm text-gray-800">#{request.booking_id}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium text-gray-500">Grund</div>
                                                    <div className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                                                        {request.reason}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                <button
                                                    onClick={() => handleAdminAction(request.booking_id, 'accept')}
                                                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold 
                                                 hover:bg-green-200 transition-colors flex items-center gap-2"
                                                    aria-label="Anfrage annehmen"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Annehmen
                                                </button>
                                                <button
                                                    onClick={() => handleAdminAction(request.booking_id, 'reject')}
                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold 
                                                 hover:bg-red-200 transition-colors flex items-center gap-2"
                                                    aria-label="Anfrage ablehnen"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Ablehnen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Block Popup */}
            {showBlockPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

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
                        <div className="px-5 py-6 space-y-4 overflow-y-auto">

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
                                <div className="grid grid-cols-1 sm:gridcols-2 gap-3">
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
                                className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold hover:bg-[#0a4d1f] transition-colors"
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