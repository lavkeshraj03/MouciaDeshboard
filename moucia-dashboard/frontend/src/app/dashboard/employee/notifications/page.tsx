'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    CheckCircle2,
    Clock,
    Info,
    AlertTriangle,
    MailOpen,
    Trash2,
    Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev: Notification[]) => prev.map((n: Notification) => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Stay updated with your latest activities and alerts</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-10 text-slate-500 font-medium">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No notifications found. You're all caught up!</div>
                ) : notifications.map((note) => (
                    <Card key={note._id} className={`border-slate-200 shadow-sm transition-all hover:border-slate-300 group cursor-pointer ${!note.isRead ? 'border-l-4 border-l-blue-600 bg-white' : 'bg-slate-50/50 opacity-90'}`}>
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${note.type === 'Task' ? 'bg-blue-100 text-blue-600' :
                                note.type === 'System' ? 'bg-indigo-100 text-indigo-600' :
                                    note.type === 'Alert' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {note.type === 'Task' ? <CheckCircle2 className="w-5 h-5" /> :
                                    note.type === 'System' ? <Info className="w-5 h-5" /> :
                                        note.type === 'Alert' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-bold ${!note.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{note.title}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 leading-snug">{note.message}</p>
                                <div className="flex items-center gap-4 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!note.isRead && (
                                        <button onClick={() => handleMarkAsRead(note._id)} className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                            <MailOpen className="w-3 h-3" /> Mark Read
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(note._id)} className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
