'use client';

import { useState, useMemo } from 'react';

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

export default function RoomsPage() {
    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    // Booking popup states
    const [openBooking, setOpenBooking] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [timeError, setTimeError] = useState('');
    const [reasonError, setReasonError] = useState('');

    // Function to open popup on cell click
    const handleCellClick = (dateIndex: number, hour: number) => {
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

    const handleBookingSubmit = () => {
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

        // Handle booking submission here
        console.log('Booking:', {
            room: selectedRoomId,
            date: selectedDate,
            startTime,
            endTime,
            reason
        });
        setTimeError('');
        setReasonError('');
        setOpenBooking(false);
    };

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

    // Get available end times based on start time
    const availableEndTimes = useMemo(() => {
        const startMinutes = timeToMinutes(startTime);
        return TIME_OPTIONS.filter(time => timeToMinutes(time) >= startMinutes);
    }, [startTime]);
    
    return (
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
                                            'relative flex min-h-[32px] items-center border-t border-[#0f692b] text-xs cursor-pointer hover:bg-[#e6f5e9]',
                                            idx === 0 ? 'border-t-0' : '',
                                            reserved ? 'bg-[#f8d9f2]' : 'bg-white'
                                        ].join(' ')}
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
            <div className="md:hidden rounded-xl bg-white p-1 max-h-[60vh] overflow-y-auto">
                <div className="flex gap-1 min-w-max">
                    <div className="flex flex-col w-8 flex-shrink-0">
                        <div className="h-6 flex items-center justify-center"></div>
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
                                        onClick={() => handleCellClick(currentDayIndex, hour)}
                                        className={[
                                            'relative flex min-h-[24px] items-center justify-center border-t border-[#0f692b] cursor-pointer hover:bg-[#e6f5e9]',
                                            idx === 0 ? 'border-t-0' : '',
                                            reserved ? 'bg-[#f8d9f2]' : 'bg-white'
                                        ].join(' ')}
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

            {/* Booking Popup */}
            {openBooking && (
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

        </div>
    </main>
    );
}