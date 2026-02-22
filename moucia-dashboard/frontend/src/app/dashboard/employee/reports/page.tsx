'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Calendar,
    ChevronRight,
    MoreVertical,
    CheckCircle2,
    Clock,
    Plus,
    Loader2
} from 'lucide-react';
import api from '@/services/api';

interface Report {
    createdAt: string;
    achievements: string;
    challenges: string;
    tomorrowPlan: string;
    date?: string; // Some existing reports might use createdAt as fall back
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await api.get('/report');
                setReports(response.data.reports || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, []);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">EOD Reports</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Review your previous end-of-day submissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> New Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Submission History</CardTitle>
                                <CardDescription className="text-xs">Your recent professional progress logs</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Loading Reports...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="py-20 text-center space-y-3">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-400 font-medium">No reports submitted yet.</p>
                                    <p className="text-xs text-slate-400">Your daily end-of-day logs will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {reports.map((report, i) => (
                                        <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                            {new Date(report.date || report.createdAt).getDate()}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800">
                                                                EOD Report - {new Date(report.date || report.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                            </h4>
                                                            <div className="flex items-center gap-4 mt-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Status: Recorded</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achievements</p>
                                                            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-blue-500/20 pl-3">{report.achievements}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Challenges</p>
                                                            <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-amber-500/20 pl-3">{report.challenges || 'No blockers reported.'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tomorrow's Plan</p>
                                                            <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-green-500/20 pl-3">{report.tomorrowPlan || 'Continuing active tasks.'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
