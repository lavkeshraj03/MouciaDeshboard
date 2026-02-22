'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Pause,
    Square,
    Clock,
    History,
    Timer,
    CheckCircle2,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function TimerPage() {
    const { user } = useAuth();
    const [sessionState, setSessionState] = useState<'Idle' | 'Active' | 'Paused'>('Idle');
    const [workedSeconds, setWorkedSeconds] = useState(user?.todayWorkedSeconds || 0);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial check for active session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('/session/status');
                if (response.data.session) {
                    setSessionState(response.data.session.status);
                    if (response.data.session.status === 'Active') {
                        setSessionStartTime(new Date(response.data.session.startTime).getTime());
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkSession();
    }, []);

    // Live timer logic
    useEffect(() => {
        if (sessionState === 'Active') {
            timerRef.current = setInterval(() => {
                if (sessionStartTime) {
                    const now = Date.now();
                    const diff = Math.floor((now - sessionStartTime) / 1000);
                    setWorkedSeconds((user?.todayWorkedSeconds || 0) + diff);
                } else {
                    setWorkedSeconds(prev => prev + 1);
                }
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionState, sessionStartTime, user?.todayWorkedSeconds]);

    const handleStart = async () => {
        try {
            await api.post('/session/start');
            setSessionState('Active');
            setSessionStartTime(Date.now());
        } catch (err) {
            console.error(err);
        }
    };

    const handlePause = async () => {
        try {
            await api.post('/session/pause');
            setSessionState('Paused');
        } catch (err) {
            console.error(err);
        }
    };

    const handleEnd = async () => {
        try {
            const response = await api.post('/session/end');
            if (response.data.warning) {
                alert(response.data.warning);
                return;
            }
            setSessionState('Idle');
            setWorkedSeconds(response.data.totalWorkedSeconds);
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Work Timer</h2>
                <p className="text-slate-500">Track and manage your daily productive hours</p>
            </div>

            {/* Central Timer Display */}
            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
                <div className="bg-[#2563EB] h-1.5 w-full"></div>
                <CardContent className="p-12 flex flex-col items-center">
                    <div className="w-64 h-64 rounded-full border-8 border-slate-50 flex flex-col items-center justify-center relative shadow-inner mb-8">
                        <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin-slow opacity-20"></div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${sessionState === 'Active' ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                            {sessionState === 'Active' ? 'Session Active' : sessionState === 'Paused' ? 'Session Paused' : 'Ready to Start'}
                        </p>
                        <h1 className="text-6xl font-mono font-bold text-slate-900 tracking-tight">
                            {formatTime(workedSeconds)}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 w-full max-w-sm">
                        {sessionState !== 'Active' ? (
                            <Button onClick={handleStart} className="flex-1 bg-[#2563EB] hover:bg-blue-700 h-14 text-lg font-bold shadow-lg shadow-blue-200 transition-all">
                                <Play className="w-5 h-5 mr-3 fill-current" /> {sessionState === 'Idle' ? 'Start Shift' : 'Resume'}
                            </Button>
                        ) : (
                            <Button onClick={handlePause} variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 h-14 text-lg font-bold transition-all">
                                <Pause className="w-5 h-5 mr-3 fill-current" /> Pause
                            </Button>
                        )}
                        {sessionState !== 'Idle' && (
                            <Button onClick={handleEnd} variant="outline" className="flex-1 border-red-100 text-red-600 hover:bg-red-50 h-14 text-lg font-bold transition-all">
                                <Square className="w-5 h-5 mr-3 fill-current" /> End Shift
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats & Session History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Timer className="w-4 h-4 text-blue-600" /> Session Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Daily Goal</span>
                            <span className="text-slate-900 font-bold">08:00:00</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all" style={{ width: `${Math.min((workedSeconds / 28800) * 100, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Progress</span>
                            <span className="text-blue-600 font-bold">{Math.round((workedSeconds / 28800) * 100)}% Completed</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <History className="w-4 h-4 text-blue-600" /> Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {[
                                { date: 'Oct 23', time: '08:12:45', status: 'Completed' },
                                { date: 'Oct 22', time: '07:55:12', status: 'Under 8h' },
                            ].map((row, i) => (
                                <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-semibold text-slate-700">{row.date}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-mono font-bold text-slate-600">{row.time}</span>
                                        <Badge variant="outline" className={`text-[10px] ${row.status === 'Completed' ? 'text-green-600 border-green-100 bg-green-50' : 'text-amber-600 border-amber-100 bg-amber-50'}`}>
                                            {row.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
