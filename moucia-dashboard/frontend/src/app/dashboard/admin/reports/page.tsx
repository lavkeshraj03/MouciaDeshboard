'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Search,
    Calendar,
    User,
    ChevronDown,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import api from '@/services/api';

interface Report {
    _id: string;
    userId: {
        _id: string;
        name: string;
        role: string;
    };
    achievements: string;
    challenges: string;
    tomorrowPlan: string;
    createdAt: string;
}

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get('/report/admin/all');
                setReports(res.data.reports);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filteredReports = reports.filter(r =>
        r.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.achievements.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">EOD Performance Reports</h2>
                    <p className="text-slate-500 text-sm mt-1">Review end-of-day submissions and daily achievements</p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by employee or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all"
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredReports.length > 0 ? filteredReports.map((report) => (
                    <Card key={report._id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="bg-slate-50 md:w-64 p-6 border-b md:border-b-0 md:border-r border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                        {report.userId.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{report.userId.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{report.userId.role}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Daily Submission</span>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 w-full justify-center py-1">
                                        Reviewed
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex-1 p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3 h-3 text-green-600" /> Achievements
                                        </label>
                                        <p className="text-sm text-slate-700 leading-relaxed italic">"{report.achievements}"</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <AlertCircle className="w-3 h-3 text-amber-600" /> Challenges
                                        </label>
                                        <p className="text-sm text-slate-700 leading-relaxed italic">"{report.challenges || 'No blockers reported.'}"</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-blue-600" /> Plan for Tomorrow
                                        </label>
                                        <p className="text-sm text-slate-700 leading-relaxed italic">"{report.tomorrowPlan}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="py-20 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-10" />
                        <p className="text-sm font-medium">No performance reports found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
