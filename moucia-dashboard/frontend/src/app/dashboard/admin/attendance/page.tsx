'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Search,
    Download,
    Clock,
    Loader2,
    Filter
} from 'lucide-react';
import api from '@/services/api';

interface AttendanceRecord {
    _id: string;
    userId: {
        _id: string;
        name: string;
    } | string;
    date: string;
    totalWorkedSeconds: number;
    status: string;
    completedShift: boolean;
    sessions?: any[];
}

export default function AdminAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                // Fetch global logs from admin endpoint
                const res = await api.get('/attendance/all');
                setRecords(res.data.logs || []);
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Monitoring</h2>
                    <p className="text-slate-500 text-sm mt-1">Global audit logs of workforce presence and shift completion</p>
                </div>
                <button className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 h-10 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <Card className="border-slate-200 shadow-sm border-0 ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="py-5 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by employee name..."
                            className="pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
                            Current Month
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Work Duration</th>
                                    <th className="px-6 py-4 text-center">Shift Target</th>
                                    <th className="px-6 py-4 text-right">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.length > 0 ? records.map((record) => (
                                    <tr key={record._id} className="hover:bg-slate-50/30 transition-colors group text-sm">
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            {typeof record.userId === 'object' && record.userId ? record.userId.name : 'Unknown Employee'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                            {record.sessions && record.sessions.length > 0 && record.sessions[0].startTime ? new Date(record.sessions[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                            {record.sessions && record.sessions.length > 0 ? (record.sessions[record.sessions.length - 1].endTime ? new Date(record.sessions[record.sessions.length - 1].endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Working') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className={`px-2 py-0.5 text-[9px] font-bold ${record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-100' :
                                                record.status === 'Half Day' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {record.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2 font-bold text-slate-600">
                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                {formatTime(record.totalWorkedSeconds)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${record.completedShift ? 'bg-blue-600' : 'bg-slate-300'}`} style={{ width: `${Math.min((record.totalWorkedSeconds / 28800) * 100, 100)}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{Math.round((record.totalWorkedSeconds / 28800) * 100)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-300 hover:text-blue-600">
                                                <Filter className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-xs italic">
                                            No attendance data found for this period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
