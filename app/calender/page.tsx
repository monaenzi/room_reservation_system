'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const RECURRING_BOOKING_MAX_YEARS = 2;

type Role = 'guest' | 'user' | 'admin';
type Weekday = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';

type Timeslot = {
    timeslot_id: number;
    room_id: number;
    timeslot_status: number;
    slot_date: string | Date;
    start_time: string;
    end_time: string;
    blocked_reason?: string;
    name?: string;
    booking_status?: number;
    user_id?: number;
    username?: string;
    is_recurring?: boolean;
    pattern_id?: number | null;
    frequency?: string;
    booking_id?: number;
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
    is_recurring?: boolean;
    pattern_id?: number | null;
    frequency?: string;
};

type UserBooking = {
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
    room_name: string;
    parent_booking_id?: number | null;
    is_recurring?: boolean;
    pattern_id?: number | null;
    until_date?: string | null;
    frequency?: string;
};

type Room = {
    room_id: number;
    room_name: string;
    room_description?: string;
    room_capacity?: number;
    floor_number?: number;
    building?: string;
    is_visible: number;
    created_by?: number;
    image_url?: string;
};

type GroupedBooking = {
    grouped_id: string;
    user_id: number;
    room_id: number;
    room_name: string;
    reason: string;
    booking_status: number;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    weekday: string;
    bookings_count: number;
    booking_ids: number[];
    is_recurring: boolean;
    pattern_id?: number | null;
    until_date?: string;
    first_booking_date: string;
    last_booking_date: string;
    frequency?: string;
    timeslot_id?: number;
    timeslot_status?: number;
};

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);
const WEEKDAYS: Weekday[] = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
];

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
    return timeStr.substring(0, 5);
}

function toLocalISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function normalizeSlotDate(dbDate: string | Date): string {
    if (!dbDate) return "";
    if (dbDate instanceof Date) {
        return toLocalISODate(dbDate);
    }
    return dbDate.split("T")[0];
}

function parseISODateAsLocalDate(dateStr: string): Date {
    const base = dateStr.split('T')[0];
    const [y, m, d] = base.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
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

function getWeekdayFromDate(dateStr: string): string {
    const date = parseISODateAsLocalDate(dateStr);
    return date.toLocaleDateString('de-DE', { weekday: 'long' });
}

function groupBookings(bookings: UserBooking[]): GroupedBooking[] {
    const groupedMap = new Map<string, GroupedBooking>();

    bookings.forEach(booking => {
        const key = booking.pattern_id
            ? `pattern_${booking.pattern_id}`
            : `${booking.user_id}_${booking.room_id}_${booking.start_time}_${booking.end_time}_${booking.reason}_${booking.parent_booking_id || 'single'}`;

        if (!groupedMap.has(key)) {
            const weekday = getWeekdayFromDate(booking.slot_date);

            groupedMap.set(key, {
                grouped_id: key,
                user_id: booking.user_id,
                room_id: booking.room_id,
                room_name: booking.room_name,
                reason: booking.reason,
                booking_status: booking.booking_status,
                start_date: booking.slot_date,
                end_date: booking.slot_date,
                start_time: booking.start_time,
                end_time: booking.end_time,
                weekday: weekday,
                bookings_count: 1,
                booking_ids: [booking.booking_id],
                is_recurring: booking.is_recurring || false,
                pattern_id: booking.pattern_id || null,
                until_date: booking.until_date || undefined,
                first_booking_date: booking.slot_date,
                last_booking_date: booking.slot_date,
                frequency: booking.frequency || undefined
            });
        } else {
            const group = groupedMap.get(key)!;

            const currentDate = parseISODateAsLocalDate(booking.slot_date);
            const firstDate = parseISODateAsLocalDate(group.first_booking_date);
            const lastDate = parseISODateAsLocalDate(group.last_booking_date);

            if (currentDate < firstDate) {
                group.first_booking_date = booking.slot_date;
                group.start_date = booking.slot_date;
            }

            if (currentDate > lastDate) {
                group.last_booking_date = booking.slot_date;
                group.end_date = booking.slot_date;
            }

            group.bookings_count += 1;
            group.booking_ids.push(booking.booking_id);
        }
    });

    return Array.from(groupedMap.values()).map(group => {
        const startDate = parseISODateAsLocalDate(group.first_booking_date);
        const endDate = parseISODateAsLocalDate(group.last_booking_date);

        return {
            ...group,
            start_date: group.first_booking_date,
            end_date: group.last_booking_date
        };
    });
}

function groupAdminRequests(requests: BookingRequest[]): GroupedBooking[] {
    const groupedMap = new Map<string, GroupedBooking>();

    requests.forEach(request => {
        const key = request.pattern_id
            ? `pattern_${request.pattern_id}`
            : `${request.user_id}_${request.room_id}_${request.start_time}_${request.end_time}_${request.reason}`;

        if (!groupedMap.has(key)) {
            const weekday = getWeekdayFromDate(request.slot_date);

            groupedMap.set(key, {
                grouped_id: key,
                user_id: request.user_id,
                room_id: request.room_id,
                room_name: request.room_name,
                reason: request.reason,
                booking_status: request.booking_status,
                start_date: request.slot_date,
                end_date: request.slot_date,
                start_time: request.start_time,
                end_time: request.end_time,
                weekday: weekday,
                bookings_count: 1,
                booking_ids: [request.booking_id],
                is_recurring: request.is_recurring || false,
                pattern_id: request.pattern_id || null,
                first_booking_date: request.slot_date,
                last_booking_date: request.slot_date,
                frequency: request.frequency || undefined
            });
        } else {
            const group = groupedMap.get(key)!;

            const currentDate = parseISODateAsLocalDate(request.slot_date);
            const firstDate = parseISODateAsLocalDate(group.first_booking_date);
            const lastDate = parseISODateAsLocalDate(group.last_booking_date);

            if (currentDate < firstDate) {
                group.first_booking_date = request.slot_date;
                group.start_date = request.slot_date;
            }

            if (currentDate > lastDate) {
                group.last_booking_date = request.slot_date;
                group.end_date = request.slot_date;
            }

            group.bookings_count += 1;
            group.booking_ids.push(request.booking_id);
        }
    });

    return Array.from(groupedMap.values()).map(group => {
        return {
            ...group,
            start_date: group.first_booking_date,
            end_date: group.last_booking_date
        };
    });
}

export default function RoomsPage() {
    const searchParams = useSearchParams();
    const initialRoomId = searchParams.get('room_id');
    const [role, setRole] = useState<Role>('guest');
    const [selectedRoomId, setSelectedRoomId] = useState<number>(() => {
        if (initialRoomId) {
            const parsed = parseInt(initialRoomId, 10);
            return !isNaN(parsed) ? parsed : 1;
        }
        return 1;
    });


    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

    const [adminRequests, setAdminRequests] = useState<BookingRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [groupedAdminRequests, setGroupedAdminRequests] = useState<GroupedBooking[]>([]);

    const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
    const [isLoadingUserBookings, setIsLoadingUserBookings] = useState(false);
    const [groupedUserBookings, setGroupedUserBookings] = useState<GroupedBooking[]>([]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showRequestsPopup, setRequestsShowPopup] = useState(false);
    const [showBlockPopup, setShowBlockPopup] = useState(false);

    const [blockRoomId, setBlockRoomId] = useState(1);
    const [blockDate, setBlockDate] = useState('');
    const [blockAllDay, setBlockAllDay] = useState(false);
    const [blockStart, setBlockStart] = useState('08:00');
    const [blockEnd, setBlockEnd] = useState('21:00');

    const [openBooking, setOpenBooking] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [timeError, setTimeError] = useState('');
    const [reasonError, setReasonError] = useState('');

    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
    const [twoYears, setTwoYears] = useState(true);
    const [showUntilDate, setShowUntilDate] = useState(false);
    const [untilDate, setUntilDate] = useState('');

    const [openBookingList, setOpenBookingList] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [showManageSeriesPopup, setShowManageSeriesPopup] = useState(false);
    const [selectedSeries, setSelectedSeries] = useState<GroupedBooking | null>(null);
    const [newEndDate, setNewEndDate] = useState('');

    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);

    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [selectedSlotDetails, setSelectedSlotDetails] = useState<Timeslot | null>(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setIsLoadingRooms(true);
                const response = await fetch('/api/rooms?visible=true');

                if (!response.ok) {
                    throw new Error(`Fehler: ${response.status}`);
                }

                const data = await response.json();

                if (data.rooms && Array.isArray(data.rooms)) {
                    const sortedRooms = [...data.rooms].sort((a, b) => a.room_id - b.room_id);
                    setRooms(sortedRooms);

                    if (sortedRooms.length > 0 && !initialRoomId) {
                        const lowestId = sortedRooms[0].room_id;
                        setSelectedRoomId(lowestId);
                        setBlockRoomId(lowestId);
                    }
                } else {
                    console.error('Ungültiges Datenformat:', data);
                    setRooms([]);
                }
            } catch (err) {
                console.error('Fehler beim Laden der Räume:', err);
                setRooms([]);
            } finally {
                setIsLoadingRooms(false);
            }
        };

        fetchRooms();
    }, [initialRoomId]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const storedRole = (localStorage.getItem('userRole') as Role) || 'guest';
            const storedUserId = localStorage.getItem('userId');

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
                        setCurrentUserId(null);
                    }
                } else {
                    setCurrentUserId(null);
                }
            }
        }
    }, []);

    // AUTO-REFRESH FUNKTIONALITÄT
    const fetchTimeslots = useCallback(async (isBackgroundRefresh = false) => {
        if (!selectedRoomId) return;

        try {
            const res = await fetch(`/api/calendar?room_id=${selectedRoomId}`);

            if (!res.ok) {
                console.error(`HTTP-Fehler! Status: ${res.status}`);
                return;
            }

            const text = await res.text();
            const data = text ? JSON.parse(text) : [];

            setTimeslots(data);
        } catch (err) {
            console.error('Fehler beim Laden der Timeslots: ', err);

            if (!isBackgroundRefresh) {
                setTimeslots([]);
            }
        }
    }, [selectedRoomId]);

    useEffect(() => {
        fetchTimeslots();

        const intervalId = setInterval(() => {
            fetchTimeslots(true);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [fetchTimeslots]);

    useEffect(() => {
        const today = new Date();
        const index = today.getDay() - 1;

        if (index >= 0 && index < 4) {
            setCurrentDayIndex(index);
        }
    }, []);

    useEffect(() => {
        if (currentUserId && (role === 'user' || role === 'admin')) {
            loadUserBookings();
        }
    }, [currentUserId, role]);

    const loadUserBookings = async () => {
        if ((role !== 'admin' && role !== 'user') || !currentUserId) return;

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

            const grouped = groupBookings(data);
            setGroupedUserBookings(grouped);
        } catch (err) {
            console.error('Fehler beim Laden der User-Buchungen:', err);
            alert('Fehler beim Laden der Buchungen');
        } finally {
            setIsLoadingUserBookings(false);
        }
    };

    const handleOpenBookingList = () => {
        loadUserBookings();
        setOpenBookingList(true);
    };

    const handleCellClick = (dateIndex: number, hour: number, e?: React.MouseEvent) => {
        //holle alle bestätigten / gesperrten slots in einer zelle
        const date = toISODate(weekDates[dateIndex]);
        const slotsInCell = getTimeslotForCell(dateIndex, hour);

        let isClickInTopHalf = true;
        if (e) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            isClickInTopHalf = relativeY <= rect.height / 2;
        }

        const cellStartMinutes = hour * 60;
        const halfPoint = cellStartMinutes + 30;
        const cellEndMinutes = (hour + 1) * 60;

        const occupiedSlotAtPosition = slotsInCell.find(t => {
            const startMin = timeToMinutes(t.start_time);
            const endMin = timeToMinutes(t.end_time);
            const isActive = t.booking_status === 1 || t.booking_status === 0 || t.timeslot_status === 3;

            if (!isActive) return false;

            if (isClickInTopHalf) {
                return startMin < halfPoint && endMin > cellStartMinutes;
            } else {
                return startMin < cellEndMinutes && endMin > halfPoint;
            }
        });

        if (occupiedSlotAtPosition) {
            const extraData = userBookings.find(b => b.timeslot_id === occupiedSlotAtPosition.timeslot_id);

            if (extraData) {
                setSelectedSlotDetails({
                    ...occupiedSlotAtPosition,
                    booking_id: extraData.booking_id,
                    is_recurring: extraData.is_recurring,
                    frequency: extraData.frequency,
                    pattern_id: extraData.pattern_id
                });
            } else {
                setSelectedSlotDetails(occupiedSlotAtPosition);
            }

            setShowDetailsPopup(true);
            return;
        }

        if (role !== 'user' && role !== 'admin') return;

        setSelectedDate(date);
        setSelectedHour(hour);
        setReason('');
        setTimeError('');
        setReasonError('');

        if (slotsInCell.length === 0) {
            setStartTime(`${hour.toString().padStart(2, '0')}:00`);
            setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
            setOpenBooking(true);
            return;
        }

        //wenn die erste hälfte frei ist, kann sie normal gebucht werden
        if(isClickInTopHalf){
            setSelectedDate(date);
            setSelectedHour(hour);
            setStartTime(`${hour.toString().padStart(2, '0')}:00`);
            setEndTime(`${hour.toString().padStart(2, '0')}:30`);
            setReason('');
            setTimeError('');
            setReasonError('');
            setOpenBooking(true);
        } else { // wenn die zweite hälfte frei ist, kann sie normal gebucht werden
            setSelectedDate(date);
            setSelectedHour(hour);
            setStartTime(`${hour.toString().padStart(2, '0')}:30`);
            setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
            setReason('');
            setTimeError('');
            setReasonError('');
            setOpenBooking(true);
        }

    };

    const handleStartTimeChange = (newStartTime: string) => {
        setStartTime(newStartTime);
        setTimeError('');

        if (timeToMinutes(endTime) <= timeToMinutes(newStartTime)) {
            setEndTime(newStartTime);
        }
    };

    const handleBookingSubmit = async () => {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const duration = endMinutes - startMinutes;

        setTimeError('');
        setReasonError('');

        if (!currentUserId) {
            setReasonError('Fehler: keine Benutzer-ID gefunden. Bitte neu einloggen.');
            return;
        }

        let hasError = false;

        // Check für Wochenende
        const selectedDateObj = new Date(selectedDate || '');
        const dayOfWeek = selectedDateObj.getDay(); // 0 = Sonntag, 6 = Samstag
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            setTimeError('Buchungen sind nur von Montag bis Freitag möglich.');
            hasError = true;
        }

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

        if (isRecurring) {
            if (!twoYears && !untilDate) {
                setReasonError('Bitte wählen Sie "2 Jahre" oder geben Sie ein Enddatum ein.');
                hasError = true;
            }
        }

        if (hasError) {
            return;
        }

        // PRÜFUNG AUF ZULETZT GEBUCHTE TERMINE
        const startH = getHourFromTime(startTime);
        const endH = getHourFromTime(endTime);

        const isInterfering = timeslots.some(t => {
            if (t.room_id !== selectedRoomId) return false;
            if (normalizeSlotDate(t.slot_date) !== selectedDate) return false;

            if (t.booking_status === 1 || t.timeslot_status === 3) {
                const tStart = getHourFromTime(t.start_time);
                const tEnd = getHourFromTime(t.end_time);
                return (startH < tEnd && endH > tStart);
            }
            return false;
        });

        if (isInterfering) {
            alert("Dieser Termin wurde soeben von jemand anderem gebucht. Der Kalender wird aktualisiert.");
            setOpenBooking(false);
            fetchTimeslots();
            return;
        }

        // WIEDERKEHRENDE BUCHUNG LOGIK 
        let finalUntilDate = '';
        if (isRecurring) {
            if (twoYears) {
                const start = new Date(selectedDate || '');
                const maxDate = new Date(start);
                maxDate.setFullYear(start.getFullYear() + RECURRING_BOOKING_MAX_YEARS);
                finalUntilDate = maxDate.toISOString().split('T')[0];
            } else {
                finalUntilDate = untilDate;
            }
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
                reason,
                is_recurring: isRecurring,
                frequency: isRecurring ? frequency : null,
                until_date: isRecurring ? finalUntilDate : null,
                max_years: RECURRING_BOOKING_MAX_YEARS
            })
        });

        const data = await res.json();
        if (!res.ok) {
            // Fehlermeldung für wiederkehrende Buchungen
            if (data.message && data.message.includes('Konflikte mit bestehenden Buchungen')) {
                setTimeError(data.message);
            } else {
                setTimeError(data.message || 'Fehler beim Buchen.');
            }
            return;
        }

        if (isRecurring) {
            alert('Wiederkehrende Buchung erfolgreich erstellt!');
        } else {
            alert('Buchung erfolgreich!');
        }

        setOpenBooking(false);
        setIsRecurring(false);
        setFrequency('daily');
        setTwoYears(false);
        setShowUntilDate(false);
        setUntilDate('');

        // Auto-refresh nutzen
        window.location.reload();
    };

    const handleDeleteBooking = async (groupedBooking: GroupedBooking) => {
        const isBlockedSlot = groupedBooking.timeslot_status === 3;
        const isRecurring = groupedBooking.is_recurring && groupedBooking.pattern_id;
        const patternId = groupedBooking.pattern_id;

        let confirmMessage = "Möchten Sie diese Buchung wirklich löschen?";
        if (isBlockedSlot) confirmMessage = "Möchten Sie diesen Slot wirklich wieder freigeben?";
        if (isRecurring) confirmMessage = "Möchten Sie die gesamte Serie wirklich löschen?";

        if (!confirm(confirmMessage)) return;

        try {
            if (isBlockedSlot && role === 'admin') {
                const res = await fetch(`/api/calendar`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        timeslot_id: groupedBooking.timeslot_id || groupedBooking.booking_ids?.[0],
                        action: 'unblock'
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Fehler beim Entsperren');
                }
                alert('Slot erfolgreich freigegeben!');
            } else if (isRecurring) {
                const res = await fetch(`/api/calendar?pattern_id=${patternId}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Fehler beim Löschen der Routine');
                }
                alert('Buchungen erfolgreich gelöscht!');
            } else {
                const idsToDelete = groupedBooking.booking_ids || [groupedBooking.booking_id || groupedBooking.timeslot_id];

                for (const id of idsToDelete) {
                    if (!id) continue;
                    const res = await fetch(`/api/calendar?booking_id=${id}`, {
                        method: 'DELETE',
                    });

                    if (!res.ok) {
                        const error = await res.json();
                        throw new Error(error.message || 'Fehler beim Löschen');
                    }
                }
                alert('Buchung erfolgreich gelöscht!');
            }

            await loadUserBookings();
            await fetchTimeslots();

        } catch (err) {
            console.error('Fehler beim Löschen:', err);
            alert(err instanceof Error ? err.message : 'Fehler beim Löschen');
        }
    };

    const handleManageSeries = (group: GroupedBooking) => {
        if (!group.is_recurring) return;
        setSelectedSeries(group);
        setNewEndDate(group.until_date || group.end_date);
        setShowManageSeriesPopup(true);
    };

    const handleUpdateSeries = async () => {
        if (!selectedSeries || !selectedSeries.pattern_id) return;

        if (!newEndDate) {
            alert('Bitte wählen Sie ein Enddatum aus.');
            return;
        }

        const newEndDateObj = new Date(newEndDate);
        const currentEndDateObj = new Date(selectedSeries.until_date || selectedSeries.end_date);

        if (newEndDateObj > currentEndDateObj) {
            alert('Das neue Enddatum darf nicht nach dem aktuellen Enddatum liegen.');
            return;
        }

        if (!confirm(`Möchten Sie die Buchungen wirklich am ${newEndDate} beenden?\n\nBereits gebuchte Termine nach diesem Datum werden dauerhaft gelöscht.`)) {
            return;
        }

        try {
            const res = await fetch('/api/calendar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pattern_id: selectedSeries.pattern_id,
                    action: 'update_end_date',
                    end_date: newEndDate
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Fehler beim Aktualisieren der Serie');
            }

            alert('Buchungen erfolgreich aktualisiert!');
            setShowManageSeriesPopup(false);
            loadUserBookings();

        } catch (err) {
            console.error('Fehler beim Aktualisieren der Serie:', err);
            alert(err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Serie');
        }
    };

    const handleBlockSubmit = async () => {
        if (!blockDate) {
            alert('Bitte wählen Sie ein Datum aus.');
            return;
        }

        const startMinutes = timeToMinutes(blockAllDay ? '08:00' : blockStart);
        const endMinutes = timeToMinutes(blockAllDay ? '21:00' : blockEnd);

        if (endMinutes <= startMinutes) {
            alert('Endzeit muss nach der Startzeit liegen.');
            return;
        }

        try {
            const res = await fetch('/api/calendar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: blockRoomId,
                    slot_date: blockDate,
                    start_time: blockAllDay ? '08:00' : blockStart,
                    end_time: blockAllDay ? '21:00' : blockEnd,
                    reason: blockAllDay ? 'Ganzer Tag gesperrt' : 'Zeitslot gesperrt'
                })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || 'Fehler beim Sperren.');
                return;
            }

            alert('Slot erfolgreich gesperrt!');
            setShowBlockPopup(false);
            fetchTimeslots();

        } catch (err) {
            console.error('Fehler beim Sperren:', err);
            alert('Fehler beim Sperren des Slots.');
        }
    };

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

            const grouped = groupAdminRequests(data);
            setGroupedAdminRequests(grouped);
        } catch (err) {
            console.error('Fehler beim Laden der Admin-Anfragen:', err);
            alert('Fehler beim Laden der Anfragen');
        } finally {
            setIsLoadingRequests(false);
        }
    };

    const handleOpenRequestsPopup = () => {
        loadAdminRequests();
        setRequestsShowPopup(true);
    };


    const handleAdminAction = async (group: GroupedBooking, action: 'accept' | 'reject') => {
        try {
            const body = group.pattern_id
                ? { pattern_id: group.pattern_id, action }
                : { booking_ids: group.booking_ids, action };

            const res = await fetch('/api/calendar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Fehler bei der Aktion');
            }

            loadAdminRequests();

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

    const getTimeslotForCell = (dateIndex: number, hour: number): Timeslot[] => {
        const dateStr = toISODate(weekDates[dateIndex]);
        return timeslotsForRoom.filter((t) => {
            const slotDateStr = normalizeSlotDate(t.slot_date);
            if (slotDateStr !== dateStr) return false;

            const startMinutes = timeToMinutes(t.start_time);
            const endMinutes = timeToMinutes(t.end_time);

            const cellStartMinutes = hour * 60;
            const cellEndMinutes = (hour + 1) * 60;

            return startMinutes < cellEndMinutes && endMinutes > cellStartMinutes;
        });
    };


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

    const availableEndTimes = useMemo(() => {
        const startMinutes = timeToMinutes(startTime);
        return TIME_OPTIONS.filter(time => timeToMinutes(time) >= startMinutes);
    }, [startTime]);

    const isReserved = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);

        return timeslotsForRoom.some((t) => {
            const slotDateStr = normalizeSlotDate(t.slot_date);
            if (slotDateStr !== dateStr) return false;
            if (!(t.booking_status === 1 || t.timeslot_status === 3)) return false;


            const startMinutes = timeToMinutes(t.start_time);
            const endMinutes = timeToMinutes(t.end_time);
            const cellStartMinutes = hour * 60;
            const cellEndMinutes = (hour + 1) * 60;

            return startMinutes <= cellStartMinutes && endMinutes >= cellEndMinutes;
        });
    };

    const isReservationStart = (dateIndex: number, hour: number) => {
        const dateStr = toISODate(weekDates[dateIndex]);

        return timeslotsForRoom.some((t) => {
            const slotDateStr = normalizeSlotDate(t.slot_date);
            if (slotDateStr !== dateStr) return false;

            const startHour = getHourFromTime(t.start_time);
            const startMinutes = timeToMinutes(t.start_time);

            return startHour === hour || (startMinutes >= hour * 60 && startMinutes < (hour + 1) * 60);

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

    const isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === "dark";
    const emptyBg = isDark ? "#1a2332" : "white";
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
                                {isLoadingRooms ? (
                                    <option value="">Lade Räume...</option>
                                ) : rooms.length === 0 ? (
                                    <option value="">Keine Räume verfügbar</option>
                                ) : (
                                    rooms
                                        .filter(room => room.is_visible === 1)
                                        .map((room) => (
                                            <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
                                        ))
                                )}
                            </select>

                            {(role === 'user' || role === 'admin') && (
                                <button
                                    onClick={handleOpenBookingList}
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
                                        const reserved = isReserved(dateIndex, hour);

                                        const cellStartMinutes = hour * 60;
                                        const cellEndMinutes = (hour + 1) * 60;
                                        const halfPoint = cellStartMinutes + 30;

                                        const firstHalfSlot = slot.find(t => {
                                        const startMin = timeToMinutes(t.start_time);
                                        const endMin = timeToMinutes(t.end_time);
                                        return startMin < halfPoint && endMin > cellStartMinutes;
                                        });

                                        const secondHalfSlot = slot.find(t => {
                                        const startMin = timeToMinutes(t.start_time);
                                        const endMin = timeToMinutes(t.end_time);
                                        return startMin < cellEndMinutes && endMin > halfPoint;
                                        });

                                        const firstHalfStarts = firstHalfSlot && timeToMinutes(firstHalfSlot.start_time) >= cellStartMinutes && timeToMinutes(firstHalfSlot.start_time) < halfPoint;

                                        const secondHalfStarts = secondHalfSlot && timeToMinutes(secondHalfSlot.start_time) >= halfPoint && timeToMinutes(secondHalfSlot.start_time) < cellEndMinutes;


                                        const getColor = (slot: Timeslot | undefined) => {
                                        //   const isDark = document.documentElement.dataset.theme === "dark";

                                        if (!slot) return isDark ? "#1a2332" : "white";

                                        if (slot.timeslot_status === 3)
                                            return isDark ? "#374151" : "#d1d5db";

                                        if (slot.booking_status === 0)
                                            return isDark ? "#e87020ff" : "#fed7aa";

                                        if (slot.booking_status === 1)
                                            return isDark ? "#249752ff" : "#62d88bff";

                                        return isDark ? "#1a2332" : "white";
                                        };


                                        const firstColor = getColor(firstHalfSlot);
                                        const secondColor = getColor(secondHalfSlot);

                                        

                                        let customStyle: React.CSSProperties = {};
                                        if (firstHalfSlot && secondHalfSlot) {
                                            customStyle = { 
                                                background: `linear-gradient(to bottom, ${firstColor} 50%, ${secondColor} 50%)` 
                                            };
                                        } else if (firstHalfSlot) {
                                            customStyle = { 
                                                background: `linear-gradient(to bottom, ${firstColor} 50%, ${emptyBg} 50%)` 
                                            };
                                        } else if (secondHalfSlot) {
                                            customStyle = { 
                                                background: `linear-gradient(to bottom, ${emptyBg} 50%, ${secondColor} 50%)` 
                                            };
                                        } else {
                                            customStyle = { backgroundColor: "emptyBg" };
                                        }


                                        const classNames = [
                                            "relative flex min-h-[32px] items-center justify-center border-t border-[#0f692b] text-xs",
                                            idx === 0 ? "border-t-0" : "",
                                            !reserved && (role === "user" || role === "admin") ? "cursor-pointer hover:bg-[#e6f5e9]" : ""
                                        ];


                                        return (
                                            <div
                                                key={hour}
                                                onClick={(e) => handleCellClick(dateIndex, hour, e)}
                                                className={classNames.filter(Boolean).join(" ")}
                                                style={customStyle}
                                            >
                                                {firstHalfStarts && firstHalfSlot && (
                                                <div className="absolute inset-x-1 top-0.5 flex flex-col items-center text-[10px] font-semibold z-10">
                                                    <span>{firstHalfSlot.username || "Belegt"}</span>
                                                    {firstHalfSlot.timeslot_status === 3 && (
                                                        <span className="text-[9px] font-normal">Gesperrt</span>
                                                    )}
                                                    {firstHalfSlot.timeslot_status === 2 && firstHalfSlot.booking_status === 0 && (
                                                        <span className="text-[9px] font-normal"></span>
                                                    )}
                                                </div>
                                            )}
            
                                                {secondHalfStarts && secondHalfSlot && (
                                                    <div className="absolute inset-x-1 bottom-0.5 flex flex-col items-center text-[10px] font-semibold z-10">
                                                        <span>{secondHalfSlot.username || "Belegt"}</span>
                                                        {secondHalfSlot.timeslot_status === 3 && (
                                                            <span className="text-[9px] font-normal">Gesperrt</span>
                                                        )}
                                                        {secondHalfSlot.timeslot_status === 2 && secondHalfSlot.booking_status === 0 && (
                                                            <span className="text-[9px] font-normal"></span>
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
                                        const reserved = isReserved(currentDayIndex, hour);

                                        const cellStartMinutes = hour * 60;
                                        const cellEndMinutes = (hour + 1) * 60;
                                        const halfPoint = cellStartMinutes + 30;

                                        const firstHalfSlot = slot.find(t => {
                                            const startMin = timeToMinutes(t.start_time);
                                            const endMin = timeToMinutes(t.end_time);
                                            return startMin < halfPoint && endMin > cellStartMinutes;
                                        });

                                        const secondHalfSlot = slot.find(t => {
                                            const startMin = timeToMinutes(t.start_time);
                                            const endMin = timeToMinutes(t.end_time);
                                            return startMin < cellEndMinutes && endMin > halfPoint;
                                        });

                                        const firstHalfStarts = firstHalfSlot && timeToMinutes(firstHalfSlot.start_time) >= cellStartMinutes && timeToMinutes(firstHalfSlot.start_time) < halfPoint;

                                        const secondHalfStarts = secondHalfSlot && timeToMinutes(secondHalfSlot.start_time) >= halfPoint && timeToMinutes(secondHalfSlot.start_time) < cellEndMinutes;

                                        const EMPTY_BG_LIGHT = "white";
                                        const EMPTY_BG_DARK = "#1a2332";



                                        const getColor = (slot: Timeslot | undefined) => {
                                        // const isDark = document.documentElement.dataset.theme === "dark";

                                            if (!slot) return isDark ? "#1a2332" : "white";

                                            if (slot.timeslot_status === 3)
                                                return isDark ? "#374151" : "#d1d5db";

                                            if (slot.booking_status === 0)
                                                return isDark ? "#dc704cff" : "#fed7aa";

                                            if (slot.booking_status === 1)
                                                return isDark ? "#14532d" : "#bbf7d0";

                                            return isDark ? EMPTY_BG_DARK : EMPTY_BG_LIGHT;
                                            };



                                        const firstColor = getColor(firstHalfSlot);
                                        const secondColor = getColor(secondHalfSlot);


                                        let customStyle: React.CSSProperties = {};
                                        if (firstHalfSlot && secondHalfSlot) {
                                            customStyle = { 
                                                background: `linear-gradient(to bottom, ${firstColor} 50%, ${secondColor} 50%)` 
                                            };
                                        } else if (firstHalfSlot) {
                                            customStyle = { 
                                                background: `linear-gradient(to bottom, ${firstColor} 50%, ${emptyBg} 50%)` 
                                            };
                                        } else if (secondHalfSlot) {
                                            customStyle = { 
                                                background: `linear-gradient(to bottom, ${emptyBg} 50%, ${secondColor} 50%)` 
                                            };
                                        } else {
                                            customStyle = { backgroundColor: "emptyBg" };
                                        }


                                        const classNames = [
                                            "relative flex min-h-[40px] items-center justify-center border-t border-[#0f692b]",
                                            idx === 0 ? "border-t-0" : "",
                                            !reserved && (role === "user" || role === "admin") ? "cursor-pointer hover:bg-[#e6f5e9]" : ""
                                        ];

                                        return (
                                            <div
                                                key={hour}
                                                onClick={(e) => handleCellClick(currentDayIndex, hour, e)}
                                                className={classNames.filter(Boolean).join(" ")}
                                                style={customStyle}
                                            >
                                                {firstHalfStarts && firstHalfSlot && (
                                                    <div className="absolute inset-x-1 top-0.5 flex flex-col items-center text-[10px] font-semibold z-10">
                                                        <span>{firstHalfSlot.username || "Belegt"}</span>
                                                        {firstHalfSlot.timeslot_status === 3 && (
                                                            <span className="text-[9px] font-normal">Gesperrt</span>
                                                        )}
                                                        {firstHalfSlot.timeslot_status === 2 && firstHalfSlot.booking_status === 0 && (
                                                            <span className="text-[9px] font-normal"></span>
                                                        )}
                                                    </div>
                                                )}
            
                                                {secondHalfStarts && secondHalfSlot && (
                                                    <div className="absolute inset-x-1 bottom-0.5 flex flex-col items-center text-[10px] font-semibold z-10">
                                                        <span>{secondHalfSlot.username || "Belegt"}</span>
                                                        {secondHalfSlot.timeslot_status === 3 && (
                                                            <span className="text-[9px] font-normal">Gesperrt</span>
                                                        )}
                                                        {secondHalfSlot.timeslot_status === 2 && secondHalfSlot.booking_status === 0 && (
                                                            <span className="text-[9px] font-normal"></span>
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

            {openBooking && (role === 'user' || role === 'admin') && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
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

                        <div className="px-5 py-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Raum
                                </label>
                                <select
                                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                                >
                                    {rooms.map((room) => (
                                        <option key={room.room_id} value={room.room_id}>
                                            {room.room_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

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

                            {timeError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {timeError}
                                </div>
                            )}

                            <div className="space-y-3 pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="recurring-booking"
                                        checked={isRecurring}
                                        onChange={(e) => {
                                            setIsRecurring(e.target.checked);
                                            if (!e.target.checked) {
                                                setFrequency('daily');
                                                setTwoYears(false);
                                                setShowUntilDate(false);
                                                setUntilDate('');
                                            }
                                        }}
                                        className="w-5 h-5 accent-[#0f692b] cursor-pointer"
                                    />
                                    <label htmlFor="recurring-booking" className="text-sm font-medium text-gray-700">
                                        Wiederkehrend buchen
                                    </label>
                                </div>

                                {isRecurring && (
                                    <div className="pl-7 space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Wiederholung
                                            </label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFrequency('daily')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${frequency === 'daily'
                                                        ? 'bg-[#0f692b] text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                >
                                                    Täglich
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFrequency('weekly')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${frequency === 'weekly'
                                                        ? 'bg-[#0f692b] text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                >
                                                    Wöchentlich
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="two-years"
                                                    checked={twoYears}
                                                    onChange={(e) => {
                                                        setTwoYears(e.target.checked);
                                                        if (e.target.checked) {
                                                            setShowUntilDate(false);
                                                            setUntilDate('');
                                                        }
                                                    }}
                                                    className="w-5 h-5 accent-[#0f692b] cursor-pointer"
                                                />
                                                <label htmlFor="two-years" className="text-sm font-medium text-gray-700">
                                                    {RECURRING_BOOKING_MAX_YEARS} Jahre
                                                </label>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="show-until-date"
                                                    checked={showUntilDate}
                                                    onChange={(e) => {
                                                        setShowUntilDate(e.target.checked);
                                                        if (e.target.checked) {
                                                            setTwoYears(false);
                                                        }
                                                    }}
                                                    className="w-5 h-5 accent-[#0f692b] cursor-pointer"
                                                />
                                                <label htmlFor="show-until-date" className="text-sm font-medium text-gray-700">
                                                    Bis
                                                </label>
                                            </div>

                                            {showUntilDate && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                        Enddatum
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={untilDate}
                                                        onChange={(e) => setUntilDate(e.target.value)}
                                                        min={selectedDate || ''}
                                                        className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

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

                            {reasonError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {reasonError}
                                </div>
                            )}
                        </div>

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

            {openBookingList && (role === 'admin' || role === 'user') && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
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

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {isLoadingUserBookings ? (
                                <div className="text-center py-8 text-gray-500">
                                    Lade Buchungen...
                                </div>
                            ) : groupedUserBookings.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Sie haben noch keine Buchungen.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {groupedUserBookings.map((group) => (
                                        <div
                                            key={group.grouped_id}
                                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-lg text-gray-800">
                                                            {group.room_name}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBookingStatusColor(group.booking_status)}`}>
                                                            {getBookingStatusText(group.booking_status)}
                                                        </span>
                                                        {group.is_recurring && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                                                                    Wiederkehrend
                                                                </span>
                                                                {group.frequency && (
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                                                                        {group.frequency === 'daily' ? 'Täglich' : 'Wöchentlich'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-500">Zeitraum</div>
                                                            <div className="text-sm text-gray-800">
                                                                {group.bookings_count === 1 ? (
                                                                    parseISODateAsLocalDate(group.start_date).toLocaleDateString('de-DE', {
                                                                        weekday: 'long',
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })
                                                                ) : (
                                                                    `${parseISODateAsLocalDate(group.start_date).toLocaleDateString('de-DE', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })} - ${parseISODateAsLocalDate(group.end_date).toLocaleDateString('de-DE', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })}`
                                                                )}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-500">Zeit</div>
                                                            <div className="text-sm text-gray-800">
                                                                {formatTimeForDisplay(group.start_time)} - {formatTimeForDisplay(group.end_time)} Uhr
                                                            </div>
                                                        </div>


                                                    </div>

                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Grund</div>
                                                        <div className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                                                            {group.reason}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4">
                                                    {group.is_recurring && (
                                                        <button
                                                            onClick={() => handleManageSeries(group)}
                                                            className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center gap-1"
                                                            aria-label="Serie verwalten"
                                                            title="Serie verwalten"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Enddatum setzen
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteBooking(group)}
                                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                                                        aria-label="Buchung löschen"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        {group.is_recurring ? 'Alle Termine löschen' : 'Löschen'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl border-t border-gray-200">
                            <div className="text-sm text-gray-600 text-center">
                                Gesamt: {groupedUserBookings.length} Buchungen
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRequestsPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl min-h-[600px] max-h-[90vh] flex flex-col">
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
                        ) : groupedAdminRequests.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-gray-500">Keine ausstehenden Anfragen</div>
                            </div>
                        ) : (
                            <div className="space-y-4 p-6 overflow-y-auto pr-2">
                                {groupedAdminRequests.map((group) => (
                                    <div
                                        key={group.grouped_id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="font-semibold text-lg text-gray-800">
                                                        {group.room_name}
                                                    </span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                                        Ausstehend
                                                    </span>
                                                    {group.is_recurring && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                                                                Wiederkehrend
                                                            </span>
                                                            {group.frequency && (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                                                                    {group.frequency === 'daily' ? 'Täglich' : 'Wöchentlich'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Benutzer</div>
                                                        <div className="text-sm text-gray-800">
                                                            {/* Wir müssen den Username aus den adminRequests holen */}
                                                            {adminRequests.find(r => r.user_id === group.user_id)?.username || `ID: ${group.user_id}`}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Zeitraum</div>
                                                        <div className="text-sm text-gray-800">
                                                            {group.bookings_count === 1 ? (
                                                                parseISODateAsLocalDate(group.start_date).toLocaleDateString('de-DE', {
                                                                    weekday: 'long',
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })
                                                            ) : (
                                                                `${parseISODateAsLocalDate(group.start_date).toLocaleDateString('de-DE', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })} - ${parseISODateAsLocalDate(group.end_date).toLocaleDateString('de-DE', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })}`
                                                            )}
                                                            {group.until_date && group.until_date !== group.end_date && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Bis: {parseISODateAsLocalDate(group.until_date).toLocaleDateString('de-DE', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Zeit</div>
                                                        <div className="text-sm text-gray-800">
                                                            {formatTimeForDisplay(group.start_time)} - {formatTimeForDisplay(group.end_time)} Uhr
                                                        </div>
                                                    </div>

                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium text-gray-500">Grund</div>
                                                    <div className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                                                        {group.reason}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                <button
                                                    onClick={() => handleAdminAction(group, 'accept')}
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
                                                    onClick={() => handleAdminAction(group, 'reject')}
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

            {showManageSeriesPopup && selectedSeries && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Buchungen vorzeitig beenden</h2>
                            <button
                                onClick={() => setShowManageSeriesPopup(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                aria-label="Schließen"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-5 py-6 space-y-4">
                            <div className=" border rounded-lg p-4">
                                <h3 className="font-semibold text-lg mb-2">{selectedSeries.room_name}</h3>
                                <div className="flex items-center gap-2 mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm ">
                                        {selectedSeries.frequency === 'daily' ? 'Tägliche' : 'Wöchentliche'} Buchung • Start: {parseISODateAsLocalDate(selectedSeries.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 " fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm">Zeit: {formatTimeForDisplay(selectedSeries.start_time)} - {formatTimeForDisplay(selectedSeries.end_time)} Uhr</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 my-2"></div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Routine Buchungen beenden am:
                                </label>
                                <input
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#0f692b]"
                                    min={selectedSeries.start_date}
                                    max={selectedSeries.until_date || selectedSeries.end_date}
                                />
                            </div>

                            <div className="border-t border-gray-200 my-2"></div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-yellow-800 font-medium">Achtung:</p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Bereits gebuchte Termine nach dem gewählten Enddatum werden dauerhaft gelöscht.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl flex gap-3 justify-end">
                            <button
                                onClick={() => setShowManageSeriesPopup(false)}
                                className="px-6 py-2.5 rounded-lg bg-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-400 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleUpdateSeries}
                                className="px-6 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold hover:bg-[#0a4d1f] transition-colors"
                            >
                                Buchungen vorzeitig beenden
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBlockPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
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

                        <div className="px-5 py-6 space-y-4 overflow-y-auto">
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
                                    {rooms.map((room) => (
                                        <option key={room.room_id} value={room.room_id}>
                                            {room.room_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

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

                            {!blockAllDay && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl flex gap-3 justify-end">
                            <button onClick={() => {
                                setBlockDate('');
                                setBlockAllDay(false);
                                setBlockStart('08:00');
                                setBlockEnd('20:00');
                                if (rooms.length > 0) {
                                    setBlockRoomId(rooms[0].room_id);
                                }
                                setShowBlockPopup(false);
                            }}
                                className='px-6 py-2.5 rounded-lg bg-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-300 transition-colors'> Abbrechen
                            </button>
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

            {showDetailsPopup && selectedSlotDetails && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Termin-Details</h2>
                            <button 
                                onClick={() => setShowDetailsPopup(false)} 
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="px-5 py-6 flex-1 space-y-6">
                            
                            <section>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBookingStatusColor(selectedSlotDetails.booking_status ?? 1)}`}>
                                        {getBookingStatusText(selectedSlotDetails.booking_status ?? 1)}
                                    </span>
                                    {!!selectedSlotDetails.is_recurring && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                                            Wiederkehrend
                                        </span>
                                    )}
                                    {selectedSlotDetails.frequency && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                                            {selectedSlotDetails.frequency === 'daily' ? 'Täglich' : 'Wöchentlich'}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {rooms.find(r => r.room_id === selectedSlotDetails.room_id)?.room_name}
                                </h3>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Datum</div>
                                    <div className="text-sm text-gray-800">
                                        {formatFullDate(parseISODateAsLocalDate(normalizeSlotDate(selectedSlotDetails.slot_date)))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Zeit</div>
                                    <div className="text-sm text-gray-800">
                                        {formatTimeForDisplay(selectedSlotDetails.start_time)} - {formatTimeForDisplay(selectedSlotDetails.end_time)} Uhr
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Gebucht von</div>
                                    <div className="text-sm text-gray-800">
                                        {selectedSlotDetails.username || 'System'}
                                    </div>
                                </div>

                                {(selectedSlotDetails.blocked_reason || selectedSlotDetails.name) && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 mb-1">Grund</div>
                                        <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            {selectedSlotDetails.blocked_reason || selectedSlotDetails.name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-5 py-4 bg-[#dfeedd] rounded-b-xl flex gap-3 justify-end">
                            {((currentUserId && selectedSlotDetails.user_id === currentUserId) || (role === 'admin' && selectedSlotDetails.timeslot_status === 3)) && (
                                <button
                                    onClick={() => {
                                        const deleteData: any = {
                                            ...selectedSlotDetails,
                                            booking_ids: selectedSlotDetails.booking_id 
                                                ? [selectedSlotDetails.booking_id] 
                                                : [selectedSlotDetails.timeslot_id],
                                            is_recurring: selectedSlotDetails.is_recurring || false,
                                            pattern_id: (selectedSlotDetails as any).pattern_id || null
                                        };
                                        handleDeleteBooking(deleteData);
                                        setShowDetailsPopup(false);
                                    }}
                                    className="px-6 py-2.5 rounded-lg bg-red-100 border border-red-700 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                                >
                                    Löschen
                                </button>
                            )}
                            <button
                                onClick={() => setShowDetailsPopup(false)}
                                className="px-6 py-2.5 rounded-lg bg-[#0f692b] text-white text-sm font-semibold hover:bg-[#0a4d1f] transition-colors"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}