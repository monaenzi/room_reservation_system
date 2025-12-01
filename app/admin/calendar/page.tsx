'use client';
import { useState } from 'react';
import Calendar from '@/components/Calendar';

export default function AdminRoomsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            <Calendar />

            {/* Admin Sidebar Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed right-0 top-1/5 translate-x-1 z-50 w-20 h-24 bg-[#dfeedd] border-2 border-green-700 rounded-l-4xl flex flex-col items-center justify-center text-green-700 text-xl shadow-lg hover:bg-[#b4cfb3] transition-colors"
            >
                <span className="w-8 h-1 bg-green-700 rounded-full mb-1"></span>
                <span className="w-8 h-1 bg-green-700 rounded-full mb-1"></span>
                <span className="w-8 h-1 bg-green-700 rounded-full"></span>
            </button>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar Panel */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full p-4">
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="self-end mb-4 text-[#0f692b] font-bold text-xl"
                    >
                        ✕
                    </button>

                    <h2 className="text-lg font-semibold text-[#0f692b] mb-4">Kalenderverwaltung</h2>
                    <button className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Anfragen verwalten
                    </button>
                    <button className="mb-2 px-3 py-2 rounded-lg bg-[#dfeedd] hover:bg-[#c8e2c1] text-[#0f692b] font-semibold text-sm">
                        Tag/Zeitslots sperren
                    </button>
                </div>
            </div>
        </>
    );
}
