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

    {
        room_id: 3,
        room_name: 'Raum 3',
        description: 'Mittlerer Konferenzraum mit Whitboard und Beamer',
        capacity: 12,
        floor_number: 1,
        building: 'WS46b',
        is_visible: true,
    },

    {
        room_id: 4,
        room_name: 'Raum 4',
        description: 'Kreativraum mit flexiblem Mobiliar',
        capacity: 6,
        floor_number: 1,
        building: 'WS46b',
        is_visible: true,
    },

    {
        room_id: 5,
        room_name: 'Raum 5',
        description: 'Stiller Arbeitsraum für konzentriertes Arbeiten',
        capacity: 4,
        floor_number: 2,
        building: 'WS46b',
        is_visible: true,
    },
];

export default function RoomsOverviewPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

    const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState<number[]>([]);


    const [roomName, setRoomName] = useState('');
    const [roomDescription, setRoomDescription] = useState('');
    const [roomCapacity, setRoomCapacity] = useState('');
    const [roomBuilding, setRoomBuilding] = useState('');
    const [roomFloor, setRoomFloor] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS.filter((r) => r.is_visible));
    //const rooms = MOCK_ROOMS.filter((r) => r.is_visible);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddRoom = () => {
        const newRoomId = rooms.length > 0 ? Math.max(...rooms.map(r => r.room_id)) + 1:1;

        const newRoom: Room = {
            room_id: newRoomId,
            room_name: roomName || `Raum ${newRoomId}`,
            description: roomDescription || null,
            capacity: roomCapacity ? parseInt(roomCapacity) : null,
            floor_number: roomFloor ? parseInt(roomFloor) : null,
            building: roomBuilding || null,
            is_visible: true,
        };

        setRooms(prevRooms => [...prevRooms, newRoom]);

        resetForm();
        setIsAddRoomOpen(false);
    };

    const handleRoomSelection = (roomId: number) => {
        setSelectedRooms(prev => {
            if(prev.includes(roomId)){
                return prev.filter(id => id !== roomId);
            } else {
                return [...prev, roomId];
            }
        });
    };

    const handleDeleteRooms = () => {
        setRooms(prevRooms => prevRooms.filter(room => !selectedRooms.includes(room.room_id)));

        setSelectedRooms([]);
        setIsDeleteRoomOpen(false);
    };
    

    const handleSelectAll = () => {
        if (selectedRooms.length === rooms.length) {
            // Alle abwählen
            setSelectedRooms([]);
        } else {
            // Alle auswählen
            setSelectedRooms(rooms.map(room => room.room_id));
        }
    };

    const resetForm = () => {
        setRoomName('');
        setRoomDescription('');
        setRoomCapacity('');
        setRoomBuilding('');
        setRoomFloor('');
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleCancel = () => {
        resetForm();
        setIsAddRoomOpen(false);
    };

    const handleCancelDelete = () => {
        setSelectedRooms([]);
        setIsDeleteRoomOpen(false);
    };

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
                        <button 
                            onClick={() => { 
                                setIsAddRoomOpen(true);
                                setIsSidebarOpen(false);
                            }}
                            className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors"
                        >
                            Raum hinzufügen
                        </button>

                        <button onClick={() => {
                            setIsDeleteRoomOpen(true);
                            setIsSidebarOpen(false);
                        }}
                        className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors">
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

            {/* Add Room Popup Overlay */}
            {isAddRoomOpen && (
                <div  className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
                    onClick={handleCancel}>
                
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}>

                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-[#0f692b] text-center">Raum hinzufügen</h2>
                            </div>


                            <div className='p-6 space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Name</label>
                                    <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition' placeholder='Raumname eingeben'/>
                                </div>

                                <div>
                                    <h3 className='block text-sm font-medium text-gray-700 mb-2'>Infos</h3>
                                    <textarea value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition h-32'
                                        placeholder='Beschreibung des Raums'/>
                                </div>

                                <div>
                                    <h3 className='block text-sm font-medium text-gray-700 mb-2'> Bild hochladen</h3>
                                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0f692b] transition-colors cursor-pointer'>
                                        <input type="file" id='room-image' accept='image/*' onChange={handleImageUpload} className='hidden'/>
                                        <label htmlFor="room-image" className='cursor-pointer block'>
                                            {imagePreview ? (
                                                <div className='flex flex-col items-center'>
                                                    <img src={imagePreview} alt="Vorschau" className='w-32 h-32 object-cover rounded-lg mb-2'/>
                                                    <span className='text-sm text-[#0f692b] font-medium'>Bild ersetzen</span>
                                                </div>
                                            ) : (
                                                <div className='flex flex-col items-center'>
                                                    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2'>
                                                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    </div>
                                                    <span className='text-sm text-gray-600'>Klicken Sie hier, um ein Bild hochzuladen</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>Kapazität</label>
                                        <input type="number"
                                                value={roomCapacity}
                                                onChange={(e) => setRoomCapacity(e.target.value)} 
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition'
                                                placeholder='Anzahl'/>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>Gebäude</label>
                                        <input type="text"
                                                value={roomBuilding}
                                                onChange={(e) => setRoomBuilding(e.target.value)}
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition'
                                                placeholder='z.B. WS46b' />
                                    </div>
                                    <div className='col-span-2'>
                                        <label className='"block text-sm font-medium text-gray-700 mb-2'>Etage</label>
                                        <input type="number"
                                        value={roomFloor}
                                        onChange={(e) => setRoomFloor(e.target.value)} 
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition'
                                        placeholder='Stockwerk'/>
                                    </div>

                                </div>
                            </div>
                            <div className='p-6 border-t border-gray-200 flex gap-3'>
                                <button onClick={handleCancel}
                                className='flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors'>Abbrechen</button>
                                <button onClick={handleAddRoom}
                                className='flex-1 px-4 py-3 bg-[#0f692b] text-white font-medium rounded-lg hover:bg-green-800 transition-colors'>Hinzufügen</button>
                            </div>
                        </div>
                    </div>
            )}

            {isDeleteRoomOpen && (
                 <div 
                    className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
                    onClick={handleCancelDelete}
                >
                    <div 
                        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Popup Header */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-[#0f692b] text-center">
                                Raum löschen
                            </h2>
                        </div>

                        {/* Popup Content */}
                        <div className="p-6">
                            {/* Select All Checkbox */}
                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    id="select-all"
                                    checked={selectedRooms.length === rooms.length && rooms.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-5 w-5 rounded border-gray-300 text-[#0f692b] focus:ring-[#0f692b]"
                                />
                                <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700">
                                    Alle auswählen
                                </label>
                            </div>

                            {/* Room List */}
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {rooms.map((room) => (
                                    <div 
                                        key={room.room_id}
                                        className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`room-${room.room_id}`}
                                            checked={selectedRooms.includes(room.room_id)}
                                            onChange={() => handleRoomSelection(room.room_id)}
                                            className="h-5 w-5 rounded border-gray-300 text-[#0f692b] focus:ring-[#0f692b]"
                                        />
                                        <label 
                                            htmlFor={`room-${room.room_id}`}
                                            className="ml-3 flex-1 cursor-pointer"
                                        >
                                            <span className="font-medium text-gray-800">
                                                {room.room_name}
                                            </span>
                                            {room.building && (
                                                <span className="ml-2 text-sm text-gray-500">
                                                    ({room.building}, Stock {room.floor_number})
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Selected Count */}
                            {selectedRooms.length > 0 && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-sm text-red-700 font-medium">
                                        {selectedRooms.length} Raum{selectedRooms.length !== 1 ? 'e' : ''} zum Löschen ausgewählt
                                    </p>
                                </div>
                            )}

                            {/* Warning Message */}
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                <p className="text-sm text-yellow-700">
                                    Gelöschte Räume können nicht wiederhergestellt werden.
                                </p>
                            </div>
                        </div>

                        {/* Popup Footer */}
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleDeleteRooms}
                                disabled={selectedRooms.length === 0}
                                className={`flex-1 px-4 py-3 font-medium rounded-lg transition-colors ${
                                    selectedRooms.length === 0
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                                Löschen ({selectedRooms.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}