'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    CalendarCheck,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceRecord {
    date: string;
    login: string;
    logout: string;
    total: string;
    status: string;
}

export default function AttendancePage() {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await api.get('/attendance');
                const logs = (response.data.logs || []).map((log: any) => ({
                    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    login: log.sessions?.[0]?.startTime ? new Date(log.sessions[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                    logout: log.sessions?.[log.sessions.length - 1]?.endTime ? new Date(log.sessions[log.sessions.length - 1].endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                    total: (log.totalWorkedSeconds / 3600).toFixed(1) + 'h',
                    status: log.status
                }));
                setAttendance(logs);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const displayLogs = attendance;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Log</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Summary of your monthly work hours and availability</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-700">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-slate-200 mx-2"></div>
                    <button
                        onClick={() => {
                            const doc = new jsPDF();
                            const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

                            doc.setFontSize(20);
                            doc.text("Attendance Report", 14, 22);

                            doc.setFontSize(11);
                            doc.text(`Employee: ${user?.name || ''}`, 14, 30);
                            doc.text(`Month: ${monthYear}`, 14, 36);

                            const tableColumn = ["Date", "Check In", "Check Out", "Total Time", "Status"];
                            const tableRows = displayLogs.map(log => [
                                log.date,
                                log.login,
                                log.logout,
                                log.total,
                                log.status
                            ]);

                            autoTable(doc, {
                                head: [tableColumn],
                                body: tableRows,
                                startY: 42,
                            });

                            doc.save(`Attendance_Report_${monthYear.replace(' ', '_')}.pdf`);
                        }}
                        className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-4 h-10 rounded-lg transition-all shadow-sm"
                    >
                        Download Report
                    </button>
                </div>
            </div>

            {/* Attendance Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { label: 'Avg Working Hours', value: attendance.length > 0 ? (attendance.reduce((acc, curr) => acc + parseFloat(curr.total), 0) / attendance.length).toFixed(1) + ' hrs' : '0.0 hrs', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Days Present', value: attendance.filter(a => a.status === 'Present').length.toString().padStart(2, '0') + ' Days', icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                <h4 className="text-lg font-bold text-slate-900 leading-tight">{stat.value}</h4>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-blue-600">
                <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Work Logs</CardTitle>
                        <CardDescription className="text-xs">Individual daily login/logout details</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Total Time</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-medium">
                                {displayLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{log.date}</td>
                                        <td className="px-6 py-4 text-slate-500">{log.login}</td>
                                        <td className="px-6 py-4 text-slate-500">{log.logout}</td>
                                        <td className="px-6 py-4 font-mono text-slate-800">{log.total}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className={`font-bold px-2 py-0.5 text-[10px] ${log.status === 'Present' ? 'text-green-600 border-green-100 bg-green-50' :
                                                log.status === 'Half Day' ? 'text-amber-600 border-amber-100 bg-amber-50' :
                                                    'text-red-50 text-red-600 border-red-100 bg-red-50/50'
                                                }`}>
                                                {log.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
