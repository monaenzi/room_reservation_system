'use client';

import { useState, useEffect } from 'react';

type Role = 'guest' | 'user' | 'admin';

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

export default function RoomsOverviewPage() {
    const [role, setRole] = useState<Role>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('userRole') as Role) || 'guest';
        }
        return 'guest';
    });

    const [userId, setUserId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('user_id'));
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

            if (!isLoggedIn) setRole('guest');
        }
    }, []);

    const isAdmin = role === 'admin'; //for checking admin rights

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [roomDescription, setRoomDescription] = useState('');
    const [roomCapacity, setRoomCapacity] = useState('');
    const [roomBuilding, setRoomBuilding] = useState('');
    const [roomFloor, setRoomFloor] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState<number[]>([]);

    const [isHideRoomOpen, setIsHideRoomOpen] = useState(false);
    const [roomsToHide, setRoomsToHide] = useState<number[]>([]);

    const [rooms, setRooms] = useState<Room[]>([]);

    const displayedRooms = isAdmin ? rooms : rooms.filter((r) => r.is_visible);

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const query = isAdmin ? '' : '?visible=true';
            const res = await fetch(`/api/rooms${query}`);
            const data = await res.json();

            if (res.ok) {
                const mappedRooms = data.rooms.map((r: any) => ({
                    ...r,
                    description: r.room_description || r.description,
                }));
                setRooms(mappedRooms);
            }
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [role]);

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

    const handleAddRoom = async () => {
        if (!roomName) {
            alert("Raumname ist erforderlich.");
            return;
        }

        const formData = new FormData();
        formData.append('room_name', roomName);
        formData.append('room_description', roomDescription);
        formData.append('room_capacity', roomCapacity);
        formData.append('floor_number', roomFloor);
        formData.append('building', roomBuilding);
        formData.append('created_by', userId || '1');

        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchRooms();
                resetForm();
                setIsAddRoomOpen(false);
            } else {
                const err = await res.json()
                alert(`Fehler : ${err.message}`);
            }
        } catch (err) {
            console.error("Error adding room", err);
        }
    };

    const handleRoomSelection = (roomId: number) => {
        setSelectedRooms(prev => {
            if (prev.includes(roomId)) {
                return prev.filter(id => id !== roomId);
            } else {
                return [...prev, roomId];
            }
        });
    };

    const handleDeleteRooms = async () => {
        if (!userId){
            alert("Sitzung ungültig - bitte erneut anmelden.");
            return
        }

        try {
            await Promise.all(selectedRooms.map(id => {
                return fetch(`/api/rooms`, { 
                    method: 'DELETE',
                    headers: {
                        'Content-Type' : 'application/json'
                    },
                    body: JSON.stringify({
                        room_id: id,
                        admin_id: userId
                    })
                });
            }));

            await fetchRooms();
            setSelectedRooms([]);
            setIsDeleteRoomOpen(false);
        } catch (err) {
            console.error("Error deleting rooms", err);
            alert("Fehler beim Löschen der Räume.");
        }
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

    const handleHideRoomSelection = (roomId: number) => {
        setRoomsToHide(prev => {
            if (prev.includes(roomId)) {
                return prev.filter(id => id !== roomId);
            } else {
                return [...prev, roomId];
            }
        });
    };

    const updateRoomVisibility = async (ids: number[], isVisible: boolean) => {
        if (!userId) {
            alert("Sitzung ungültig - bitte erneut anmelden.");
            return;
        }

        try {
            await Promise.all(ids.map(id => {
                return fetch('/api/rooms', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        room_id: id,
                        is_visible: isVisible,
                        admin_id: userId
                    }),
                });
            }));
            await fetchRooms();
        } catch (err) {
            console.error("Error updating room visibility", err);
            alert("Fehler beim Aktualisieren der Sichtbarkeit.");
        }
    };

    const handleHideRooms = async () => {
        await updateRoomVisibility(roomsToHide, false);
        setRoomsToHide([]);
        setIsHideRoomOpen(false);
    };

    const handleUnhideRooms = async () => {
        await updateRoomVisibility(roomsToHide, true);
        setRoomsToHide([]);
        setIsHideRoomOpen(false);
    };

    const handleSelectAllHide = () => {
        if (roomsToHide.length === rooms.length) {
            setRoomsToHide([]);
        } else {
            setRoomsToHide(rooms.map(room => room.room_id));
        }
    }

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

    const handleCancelHide = () => {
        setRoomsToHide([]);
        setIsHideRoomOpen(false);
    };

    return (
        <>
            <main className="flex justify-center px-3 py-6 mt-20 sm:px-4 sm:py-10 sm:mt-24">
                <div className="w-full max-w-5xl space-y-6 md:space-y-10">
                    {displayedRooms.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500">
                            Es sind noch keine Räume vorhanden.
                        </div>
                    )}

                    {isLoading && (
                        <div className="text-center text-gray-500">Lade Räume...</div>
                    )}

                    {displayedRooms.map((room, index) => (
                        <section key={room.room_id} className={`rounded-2xl bg-[#dfeedd] px-4 py-5 sm:rounded-3xl sm:px-6 sm:pb-8 sm:pt-6 md:px-10 md:pt-8 shadow-xl relative ${!room.is_visible ? 'opacity-70 border-2 border-yellow-400' : ''}`}>

                            {isAdmin && !room.is_visible && (
                                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                                    Ausgeblendet
                                </div>
                            )}

                            <div className={['flex flex-col gap-6 rounded-3xl bg-[#eaf4e7] p-4 md:p-6 md:gap-8', index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row',
                            ].join(' ')}>
                                {/* Image */}
                                <div className="order-3 md:order-none md:w-1/2">
                                    <div className="overflow-hidden rounded-2xl bg-gray-200 shadow aspect-[4/3] flex items-center justify-center sm:rounded-3xl">
                                        {room.image_url ? (
                                            <img src={room.image_url} alt={room.room_name} className="h-full w-full object-cover" />
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

            {isAdmin && (
                <>
                    {/* Sidebar Toggle Button */}
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="fixed right-0 top-1/4 sm:top-1/5 translate-x-1 z-50 w-14 h-16 sm:w-20 sm:h-24 bg-[#dfeedd] border-2 border-green-700 rounded-l-2xl sm:rounded-l-4xl flex flex-col items-center justify-center text-green-700 text-xl shadow-lg hover:bg-[#b4cfb3] transition-colors"
                        >
                            <span className="w-6 h-1 sm:w-8 bg-green-700 rounded-full mb-1" />
                            <span className="w-6 h-1 sm:w-8 bg-green-700 rounded-full mb-1" />
                            <span className="w-6 h-1 sm:w-8 bg-green-700 rounded-full" />
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
                        className={`fixed top-0 right-0 h-full w-[75vw] sm:w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
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

                                <button onClick={() => {
                                    setIsHideRoomOpen(true);
                                    setIsSidebarOpen(false);
                                }}
                                    className="w-full px-3 py-3 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm transition-colors">
                                    Raum einblenden/ausblenden
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add Room Popup Overlay */}
                    {isAddRoomOpen && (
                        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
                            onClick={handleCancel}>

                            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}>

                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-2xl font-bold text-[#0f692b] text-center">Raum hinzufügen</h2>
                                </div>


                                <div className='p-6 space-y-4 overflow-y-auto'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>Name</label>
                                        <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition' placeholder='Raumname eingeben' />
                                    </div>

                                    <div>
                                        <h3 className='block text-sm font-medium text-gray-700 mb-2'>Infos</h3>
                                        <textarea value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition h-32'
                                            placeholder='Beschreibung des Raums' />
                                    </div>

                                    <div>
                                        <h3 className='block text-sm font-medium text-gray-700 mb-2'> Bild hochladen</h3>
                                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0f692b] transition-colors cursor-pointer'>
                                            <input type="file" id='room-image' accept='image/*' onChange={handleImageUpload} className='hidden' />
                                            <label htmlFor="room-image" className='cursor-pointer block'>
                                                {imagePreview ? (
                                                    <div className='flex flex-col items-center'>
                                                        <img src={imagePreview} alt="Vorschau" className='w-32 h-32 object-cover rounded-lg mb-2' />
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

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-2'>Kapazität</label>
                                            <input type="number"
                                                value={roomCapacity}
                                                onChange={(e) => setRoomCapacity(e.target.value)}
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f692b] focus:border-[#0f692b] outline-none transition'
                                                placeholder='Anzahl' />
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
                                                placeholder='Stockwerk' />
                                        </div>

                                    </div>
                                </div>
                                <div className='p-6 border-t border-gray-200 flex flex-col-reverse sm: flex-row gap-3 flex-shrink-0'>
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
                                className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Popup Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-2xl font-bold text-[#0f692b] text-center">
                                        Raum löschen
                                    </h2>
                                </div>

                                {/* Popup Content */}
                                <div className="p-6 overflow-y-auto">
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
                                    <div className="space-y-3">
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
                                <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 flex-shrink-0">
                                    <button
                                        onClick={handleCancelDelete}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={handleDeleteRooms}
                                        disabled={selectedRooms.length === 0}
                                        className={`flex-1 px-4 py-3 font-medium rounded-lg transition-colors ${selectedRooms.length === 0
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

                    {isHideRoomOpen && (
                        <div className='fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4' onClick={handleCancelHide}>

                            <div
                                className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className='p-6 border-b border-gray-200'>

                                    <h2 className='text-2xl font-bold text-[#0f692b] text-center'>Raum ausblenden/sperren</h2>
                                </div>
                                <div className='p-6 overflow-y-auto'>
                                    <div className='mb-4 flex items-center'>
                                        <input type="checkbox"
                                            id='select-all-hide'
                                            checked={roomsToHide.length === rooms.length && rooms.length > 0}
                                            onChange={handleSelectAllHide}
                                            className='h-5 w-5 rounded border-gray-300 text-[#0f692b] focus:ring-[#0f692b]' />
                                        <label htmlFor="select-all-hide" className='ml-3 text-sm font-medium text-gray-700'>Alle auswählen</label>
                                    </div>

                                    <div className='space-y-3'>
                                        {rooms.map((room) => (
                                            <div
                                                key={room.room_id}
                                                className={`flex items-center p-3 rounded-lg border transition-colors ${room.is_visible
                                                        ? 'border-gray-200 hover:bg-gray-50'
                                                        : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                                                    }`}>
                                                <input type="checkbox"
                                                    id={`hide-room-${room.room_id}`}
                                                    checked={roomsToHide.includes(room.room_id)}
                                                    onChange={() => handleHideRoomSelection(room.room_id)}
                                                    className='h-5 w-5 rounded border-gray-300 text-[#0f692b] focus:ring-[#0f692b]' />
                                                <label htmlFor={`hide-room-${room.room_id}`}
                                                    className='ml-3 flex-1 cursor-pointer'>
                                                    <div className='flex items-center justify-between'>
                                                        <div>
                                                            <span className="font-medium text-gray-800">
                                                                {room.room_name}
                                                            </span>
                                                            {room.building && (
                                                                <span className='ml-2 text-sm text-gray-500'>
                                                                    ({room.building}, Stock {room.floor_number})
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!room.is_visible && (
                                                            <span className='px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full'>
                                                                Ausgeblendet
                                                            </span>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    {roomsToHide.length > 0 && (
                                        <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100'>
                                            <p className='text-sm text-blue-700 font-medium'>{roomsToHide.length} Raum{roomsToHide.length !== 1 ? 'e' : ''} zum Ausblenden/Einblenden ausgewählt</p>
                                        </div>
                                    )}

                                    <div className='mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                                        <p className='text-sm text-gray-700'>
                                            <span className='font-semibold'>Hinweis:</span>
                                            Ausgeblendete Räume werden für normale Benutzer nicht angezeigt, bleiben aber im System erhalten.
                                        </p>
                                    </div>
                                </div>
                                <div className='p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 flex-shrink-0'>
                                    <button onClick={handleCancelHide}
                                        className="w-full sm:flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                                    >Abbrechen</button>
                                    <div className="flex flex-row gap-2 w-full sm:flex-1 order-1 sm:order-2">
                                        <button onClick={handleHideRooms}
                                            disabled={roomsToHide.length === 0}
                                            className={`flex-1 px-4 py-3 font-medium rounded-lg transition-colors ${roomsToHide.length === 0
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                }`}
                                        >Ausblenden</button>
                                        <button onClick={handleUnhideRooms}
                                            disabled={roomsToHide.length === 0}
                                            className={`flex-1 px-4 py-3 font-medium rounded-lg transition-colors ${roomsToHide.length === 0
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                        >Einblenden</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </>
            )}
        </>
    );
}

