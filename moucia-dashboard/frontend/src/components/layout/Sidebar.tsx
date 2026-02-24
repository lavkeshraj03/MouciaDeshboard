'use client';

import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Clock,
    CheckSquare,
    Calendar,
    BarChart3,
    FileText,
    Bell,
    User,
    LogOut,
    Building2,
    Briefcase,
    Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/services/api';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
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

        // Polling every minute to keep count fresh
        const interval = setInterval(fetchUnreadCount, 60000);
        window.addEventListener('notificationsUpdated', fetchUnreadCount);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationsUpdated', fetchUnreadCount);
        };
    }, [user]);

    const employeeNavItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/employee' },
        { label: 'Work Timer', icon: Clock, href: '/dashboard/employee/timer' },
        { label: 'My Tasks', icon: CheckSquare, href: '/dashboard/employee/tasks' },
        { label: 'Attendance', icon: Calendar, href: '/dashboard/employee/attendance' },
        { label: 'Reports', icon: BarChart3, href: '/dashboard/employee/reports' },
        { label: 'Documents', icon: FileText, href: '/dashboard/employee/documents' },
        { label: 'Notifications', icon: Bell, href: '/dashboard/employee/notifications' },
        { label: 'Profile', icon: User, href: '/dashboard/employee/profile' },
    ];

    const adminNavItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/admin' },
        { label: 'Employees', icon: User, href: '/dashboard/admin/employees' },
        { label: 'Projects', icon: Briefcase, href: '/dashboard/admin/projects' },
        { label: 'Tasks', icon: CheckSquare, href: '/dashboard/admin/tasks' },
        { label: 'Attendance', icon: Calendar, href: '/dashboard/admin/attendance' },
        { label: 'Reports', icon: BarChart3, href: '/dashboard/admin/reports' },
        { label: 'Settings', icon: Settings, href: '/dashboard/admin/settings' },
    ];

    const navItems = user?.role === 'Admin' ? adminNavItems : employeeNavItems;

    return (
        <aside className="w-64 bg-[#0F172A] text-slate-400 flex flex-col h-screen fixed top-0 left-0 overflow-y-auto border-r border-slate-800">
            {/* Logo Section */}
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Building2 className="text-white w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Moucia</h2>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Enterprise</p>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === item.href
                            ? 'bg-[#2563EB] text-white font-medium shadow-md shadow-blue-900/20'
                            : 'hover:bg-[#1E293B] hover:text-slate-200'
                            }`}
                    >
                        <item.icon className={`w-4 h-4 ${pathname === item.href ? 'text-white' : 'text-slate-400'}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.label === 'Notifications' && unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-800 mt-auto bg-[#0d1322]">
                <div className="px-3 py-3 mb-4 rounded-lg bg-[#1E293B]/50 border border-slate-800">
                    <p className="text-xs font-semibold text-slate-300 truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email || 'user@moucia.com'}</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-3 py-2 w-full rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400 text-sm font-medium border border-transparent hover:border-red-500/20"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
