'use client';

import { useState } from 'react';

type Room = {
    room_id: number;
    room_name: string;
    description: string | null;
    capacity: number | null;
    floor_number: number | null;
    building: string | null;
    is_visible: boolean;
    image_url?: string | null;
};

const MOCK_ROOMS: Room[] = [
    {
        room_id: 1,
        room_name: 'Raum 1',
        description: 'Großer Raum mit insgesamt 12 Arbeitsplätzen und zusätzlichen Stühlen bei Bedarf. Ideal für Gruppenarbeiten und Meetings. Der Raum verfügt über einen Beamer, Kaffeemaschinen und Kühlschrank. Zusätlich zu den Arbeitsplätzen gibt es eine gemütliche Sitzecke mit zwei Couches zum Entspannen.',
        capacity: 20,
        floor_number: 0,
        building: 'WS46b',
        is_visible: true,
        image_url: '/pictures/room1.jpg',
    },
    {
        room_id: 2,
        room_name: 'Raum 2',
        description: 'Kleinerer Raum mit 3 Arbeitsplätzen und zusätzlich Stühlen bei Bedarf. Der Raum eignet sich besonders für Einzelarbeit oder kleine Gruppen. Ausgestattet mit 3 Monitoren und einem Drucker.',
        capacity: 8,
        floor_number: 0,
        building: 'WS46b',
        is_visible: true,
        image_url: '/pictures/room2.jpg',
    },
];

export default function RoomsOverviewPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const rooms = MOCK_ROOMS.filter((r) => r.is_visible);

    return (
        <>
            <main className="flex justify-center px-3 py-6 mt-20 sm:px-4 sm:py-10 sm:mt-24">
                <div className="w-full max-w-5xl space-y-6 md:space-y-10">
                    {rooms.map((room, index) => (
                        <section key={room.room_id} className="rounded-2xl bg-[#dfeedd] px-4 py-5 sm:rounded-3xl sm:px-6 sm:pb-8 sm:pt-6 md:px-10 md:pt-8 shadow-xl">
                            <div className={['flex flex-col gap-6 rounded-3xl bg-[#eaf4e7] p-4 md:p-6 md:gap-8', index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row',
                                ].join(' ')}>
                                {/* Image */}
                                <div className="order-3 md:order-none md:w-1/2">
                                    <div className="overflow-hidden rounded-2xl bg-gray-200 shadow aspect-[4/3] flex items-center justify-center sm:rounded-3xl">
                                        {room.image_url ? (
                                            <img src={room.image_url} alt={room.room_name} className="h-full w-full object-cover"/>
                                        ) : (
                                            <div className="flex aspect-[4/3] items-center justify-center text-xs text-gray-500">
                                                Noch kein Bild vorhanden
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info area */}
                                <div className="flex flex-1 flex-col md:w-1/2">
                                    
                                    <div className="order-2 md:order-none flex-1 rounded-2xl border border-[#b9d1b7] bg-white/80 px-4 py-4 text-xs mt-5 sm:rounded-3xl sm:px-4 sm:text-sm md:px-5 md:py-4">
                                        <div className="mb-2 text-lg font-semibold text-[#0f692b] sm:text-xl">
                                            Infos:
                                        </div>
                                        <dl className="space-y-2.5">
                                            <div>
                                                <dt className="font-semibold">Beschreibung</dt>
                                                <dd>
                                                    {room.description || 'Noch keine Beschreibung vorhanden.'}
                                                </dd>
                                            </div>
                                            <div className="flex flex-row gap-8 text-xs justify-center text-center sm:gap-4 sm:text-sm">
                                                <div>
                                                    <dt className="font-semibold">Kapazität</dt>
                                                    <dd>
                                                        {room.capacity != null
                                                            ? `${room.capacity} Personen`
                                                            : '—'}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold">Gebäude</dt>
                                                    <dd>{room.building || '—'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold">Etage</dt>
                                                    <dd>
                                                        {room.floor_number != null
                                                            ? `Stock ${room.floor_number}`
                                                            : '—'}
                                                    </dd>
                                                </div>
                                            </div>
                                        </dl>
                                    </div>

                                    <div className="order-1 md:order-none mb-0 text-3xl font-extrabold tracking-wide text-[#0f692b] text-center sm:mt-4 sm:text-4xl md:mt-6 md:text-5xl">
                                        {room.room_name}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {/* Sidebar Toggle Button */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-20 h-24 bg-[#dfeedd] border-2 border-green-700 rounded-l-4xl flex flex-col items-center justify-center text-green-700 text-xl shadow-lg hover:bg-[#b4cfb3] transition-colors"
                >
                    <span className="w-8 h-1 bg-green-700 rounded-full mb-1" />
                    <span className="w-8 h-1 bg-green-700 rounded-full mb-1" />
                    <span className="w-8 h-1 bg-green-700 rounded-full" />
                </button>
            )}

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
                    isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full p-4">
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="self-end mb-4 text-[#0f692b] font-bold text-xl hover:text-green-800 transition-colors"
                    >
                        ✕
                    </button>

                    <h2 className="text-lg font-semibold text-[#0f692b] mb-4">Raumverwaltung</h2>
                    
                    <div className="space-y-2">
                        <button className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors">
                            Raum hinzufügen
                        </button>
                        <button className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors">
                            Raum löschen
                        </button>
                        <button className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors">
                            Raum ausblenden
                        </button>
                        <button className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors">
                            Raum bearbeiten
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}