'use client';

type Room = {
    room_id: number;
    room_name: string;
    description: string | null;
    capacity: number | null;
    floor_number: number | null;
    building: string | null;
    is_visible: boolean;
    image_url?: string | null; // URL from image storage
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
        image_url: '/pictures/raum2.jpg',
    },
];

export default function RoomsOverviewPage() {
    const rooms = MOCK_ROOMS.filter((r) => r.is_visible);

    return (
        <main className="flex justify-center px-4 py-10 mt-24">
            <div className="w-full max-w-5xl space-y-10">
                {rooms.map((room, index) => (
                    <section key={room.room_id} className="rounded-3xl bg-[#dfeedd] px-6 pb-8 pt-6 md:px-10 md:pt-8">
                        <div className={['flex flex-col gap-5 rounded-3xl bg-[#eaf4e7] p-4 md:p-6 md:gap-8', index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row',
                            ].join(' ')}>
                            {/* Image */}
                            <div className="md:w-1/2">
                                <div className="overflow-hidden rounded-3xl bg-gray-200 shadow aspect-[4/3] flex items-center justify-center">
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
                                
                                <div className="flex-1 rounded-3xl border border-[#b9d1b7] bg-white/80 px-4 py-3 text-sm text-gray-700 md:px-5 md:py-4">
                                    <div className="mb-2 text-xl font-semibold text-[#0f692b]">
                                        Infos:
                                    </div>
                                    <dl className="space-y-1.5">
                                        <div>
                                            <dt className="font-semibold">Beschreibung</dt>
                                            <dd>
                                                {room.description || 'Noch keine Beschreibung vorhanden.'}
                                            </dd>
                                        </div>
                                        <div className="flex gap-4">
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

                                <div className="mt-4 text-5xl font-extrabold tracking-wide text-[#0f692b] md:mt-6">
                                    {room.room_name}
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
