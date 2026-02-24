'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell, Search, Settings, HelpCircle, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';

export default function Header() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (user?.role !== 'Admin') {
                try {
                    const res = await api.get('/notifications');
                    const unread = res.data.notifications.filter((n: any) => !n.isRead).length;
                    setUnreadCount(unread);
                } catch (error) {
                    console.error('Failed to fetch notification count', error);
                }
            }
        };
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 60000);
        window.addEventListener('notificationsUpdated', fetchUnreadCount);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationsUpdated', fetchUnreadCount);
        };
    }, [user]);

    return (
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
            {/* Left Side: Search */}
            <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks, documents, or help..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-full text-sm transition-all outline-none text-slate-600"
                    />
                </div>
            </div>

            {/* Right Side: Actions & Profile */}
            <div className="flex items-center space-x-4">
                <Link href={user?.role === 'Admin' ? '#' : '/dashboard/employee/notifications'} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative cursor-pointer">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </Link>

                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                    <HelpCircle className="w-5 h-5" />
                </button>

                <div className="h-8 w-px bg-slate-200 mx-2"></div>

                <div className="flex items-center space-x-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none">{user?.name}</p>
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mt-1">{user?.role}</p>
                    </div>
                    <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm ring-1 ring-slate-200">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
