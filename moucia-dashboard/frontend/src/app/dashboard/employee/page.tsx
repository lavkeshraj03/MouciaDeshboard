'use client';

import confetti from 'canvas-confetti';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Pause,
    Square,
    Clock,
    CalendarDays,
    CheckCircle2,
    Timer,
    CheckSquare,
    TrendingUp,
    ChevronRight,
    MoreHorizontal,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import io from 'socket.io-client';
import { useProductivityTracker } from '@/hooks/useProductivityTracker';

interface Task {
    _id: string;
    title: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Progress' | 'Completed';
    dueDate: string;
}

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [sessionState, setSessionState] = useState<'Idle' | 'Active' | 'Paused'>('Idle');
    const [workedSeconds, setWorkedSeconds] = useState(0);
    const [baseWorkedSeconds, setBaseWorkedSeconds] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
    const [report, setReport] = useState({ achievements: '', challenges: '', tomorrowPlan: '' });
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [targetShiftSeconds, setTargetShiftSeconds] = useState(28800); // 8 hours default
    const [minSessionSeconds, setMinSessionSeconds] = useState(7200); // 120 mins default
    const [socketInstance, setSocketInstance] = useState<any>(null);
    const [hasAcknowledgedTracking, setHasAcknowledgedTracking] = useState(false);

    // Task Logging State
    const [loggingTask, setLoggingTask] = useState<Task | null>(null);
    const [logMinutes, setLogMinutes] = useState(30);
    const [logDesc, setLogDesc] = useState('');
    const [isLogging, setIsLogging] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Productivity Tracker Hook
    const activityState = useProductivityTracker(
        sessionState === 'Active',
        socketInstance
    );

    // Productivity Notice Persistance
    useEffect(() => {
        const ack = localStorage.getItem('productivityNoticeAcknowledged');
        if (ack === 'true') {
            setHasAcknowledgedTracking(true);
        }
    }, []);

    const handleAcknowledge = () => {
        localStorage.setItem('productivityNoticeAcknowledged', 'true');
        setHasAcknowledgedTracking(true);
    };

    // Fetch initial session and tasks
    useEffect(() => {
        const initDashboard = async () => {
            try {
                // Check Session
                const sessionRes = await api.get('/session/status');
                const dsWorkedSeconds = sessionRes.data.todayWorkedSeconds || 0;
                setBaseWorkedSeconds(dsWorkedSeconds);
                setWorkedSeconds(dsWorkedSeconds);

                if (sessionRes.data.session) {
                    setSessionState(sessionRes.data.session.status);
                    if (sessionRes.data.session.status === 'Active') {
                        setSessionStartTime(new Date(sessionRes.data.session.startTime).getTime());
                    }
                }

                // Fetch Global Settings
                const settingsRes = await api.get('/settings');
                if (settingsRes.data.settings) {
                    setTargetShiftSeconds((settingsRes.data.settings.targetHours || 8) * 3600);
                    setMinSessionSeconds((settingsRes.data.settings.minimumSessionBuffer || 120) * 60);
                }

                // Fetch Tasks
                const tasksRes = await api.get('/task');
                setTasks(tasksRes.data.tasks);

                // Fetch Weekly Attendance
                const attendanceRes = await api.get('/attendance/weekly');
                processWeeklyData(attendanceRes.data.attendances);

                setIsLoadingTasks(false);
            } catch (err) {
                console.error('Failed to initialize dashboard:', err);
                setIsLoadingTasks(false);
            }
        };

        const processWeeklyData = (records: any[]) => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Days = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayName = days[date.getDay()];
                const dateString = date.toISOString().split('T')[0];

                const record = records.find(r => r.date.split('T')[0] === dateString);
                last7Days.push({
                    day: dayName,
                    hours: record ? record.totalWorkedSeconds / 3600 : 0,
                    isToday: i === 0
                });
            }
            setWeeklyAttendance(last7Days);
        };

        initDashboard();

        // Connect Socket
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
        setSocketInstance(socket);

        socket.on('shiftSettingsUpdated', (newSettings) => {
            if (newSettings && newSettings.targetHours) {
                setTargetShiftSeconds(newSettings.targetHours * 3600);
            }
            if (newSettings && newSettings.minimumSessionBuffer) {
                setMinSessionSeconds(newSettings.minimumSessionBuffer * 60);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Live Timer Engine
    useEffect(() => {
        if (sessionState === 'Active') {
            timerRef.current = setInterval(() => {
                if (sessionStartTime) {
                    const now = Date.now();
                    const diff = Math.floor((now - sessionStartTime) / 1000);
                    setWorkedSeconds(baseWorkedSeconds + diff);
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
    }, [sessionState, sessionStartTime, baseWorkedSeconds]);

    const handleStart = async () => {
        try {
            await api.post('/session/start');
            setSessionState('Active');
            setBaseWorkedSeconds(workedSeconds);
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

    const handlePauseAttempt = async () => {
        try {
            const res = await api.post('/session/pause');
            alert(res.data.message);
            if (res.data.session.status === 'Ended') {
                setSessionState('Idle');
                setWorkedSeconds(res.data.session.duration);
                setBaseWorkedSeconds(res.data.session.duration);
            } else {
                setSessionState('Paused');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEndAttempt = async () => {
        const confirmForce = window.confirm('Are you sure you want to end your shift? Make sure you have completed your required hours.');
        if (!confirmForce) return;

        try {
            const response = await api.post('/session/end');
            if (workedSeconds >= targetShiftSeconds) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                setTimeout(() => {
                    alert(response.data.message);
                }, 500);
            } else {
                alert(response.data.message);
            }
            setSessionState('Idle');
            setWorkedSeconds(response.data.totalWorkedSeconds);
            setBaseWorkedSeconds(response.data.totalWorkedSeconds);
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await api.put('/task/status', { taskId, status: newStatus });
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t));
        } catch (err) {
            console.error('Failed to update task status:', err);
        }
    };

    const handleLogTime = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loggingTask) return;
        setIsLogging(true);
        try {
            await api.post('/task/log', {
                taskId: loggingTask._id,
                timeSpentSeconds: logMinutes * 60,
                description: logDesc,
                completed: loggingTask.status === 'Completed'
            });
            alert('Time logged successfully!');
            setLoggingTask(null);
            setLogMinutes(30);
            setLogDesc('');
        } catch (err) {
            console.error('Failed to log time:', err);
            alert('Failed to log time.');
        } finally {
            setIsLogging(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!report.achievements) {
            alert('Achievements are required for the daily report.');
            return;
        }
        setIsSubmittingReport(true);
        try {
            await api.post('/report', report);
            alert('Daily report submitted successfully!');
            setReport({ achievements: '', challenges: '', tomorrowPlan: '' });
        } catch (err) {
            console.error('Failed to submit report:', err);
            alert('Failed to submit report. Please try again.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const shiftPercentage = Math.min((workedSeconds / targetShiftSeconds) * 100, 100);
    const hoursLeft = Math.max(0, (targetShiftSeconds - workedSeconds) / 3600).toFixed(1);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-50 text-red-600 border-red-100';
            case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Low': return 'bg-slate-50 text-slate-600 border-slate-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'text-green-600';
            case 'In Progress': return 'text-blue-600';
            default: return 'text-slate-500';
        }
    };

    if (!hasAcknowledgedTracking && sessionState === 'Idle') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workplace Productivity Notice</h2>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-left space-y-4">
                    <p className="text-slate-700 text-sm leading-relaxed">
                        To maintain a transparent and balanced work environment, Moucia utilizes a <strong>Lightweight Productivity Monitor</strong> during your active work sessions.
                    </p>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                        <li><strong>Activity Tracking:</strong> We measure active time vs idle time based on general interactions (mouse, keyboard).</li>
                        <li><strong>Focus Tracking:</strong> Time spent focused away from the dashboard tab is logged conditionally.</li>
                        <li><strong>No Spyware:</strong> We <strong>DO NOT</strong> track personal apps, external software, or browser history. Tracking completely stops when your shift ends.</li>
                    </ul>
                </div>
                <Button
                    onClick={handleAcknowledge}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8"
                >
                    Acknowledge & Continue to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Employee Workspace</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Welcome back, {user?.name}. Here is your overview for today.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${sessionState === 'Active' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <span className={`text-xs font-bold uppercase tracking-widest ${sessionState === 'Active' ? 'text-green-700' : 'text-red-700'}`}>
                            {sessionState === 'Active' ? 'Online' : 'Offline'}
                        </span>
                        <div
                            onClick={() => {
                                if (sessionState === 'Active') {
                                    handlePauseAttempt();
                                } else {
                                    handleStart();
                                }
                            }}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full cursor-pointer transition-colors ${sessionState === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${sessionState === 'Active' ? 'translate-x-8' : 'translate-x-1'}`} />
                        </div>
                    </div>
                    {sessionState !== 'Idle' && (
                        <Button onClick={handleEndAttempt} variant="outline" className="border-red-100 text-red-600 hover:bg-red-50 h-10 px-5 transition-colors">
                            <Square className="w-4 h-4 mr-2" /> End Shift
                        </Button>
                    )}
                </div>
            </div>

            {/* 1. Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-blue-600">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activityState === 'Active' && sessionState === 'Active' ? 'bg-green-50 text-green-600' : activityState === 'Away' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${sessionState === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                                {sessionState === 'Active' ? activityState : sessionState === 'Paused' ? 'Paused' : 'Offline'}
                            </h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Work</p>
                            <h4 className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{formatTime(workedSeconds)}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Timer className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining</p>
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold text-slate-900 mt-0.5">{hoursLeft} hrs</h4>
                                <span className="text-[10px] text-slate-400 font-bold">{Math.round(shiftPercentage)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${shiftPercentage}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 2. My Tasks Section */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-slate-200 shadow-sm min-h-[400px]">
                        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Current Assignments</CardTitle>
                                <CardDescription className="text-xs mt-0.5">Manage your active work tasks and status</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                            <th className="px-6 py-3">Task Name</th>
                                            <th className="px-6 py-3">Priority</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                            <th className="px-6 py-3 text-right">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-50">
                                        {isLoadingTasks ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                                                    <p className="text-slate-400 text-xs mt-2">Loading tasks...</p>
                                                </td>
                                            </tr>
                                        ) : tasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400">No tasks assigned yet.</td>
                                            </tr>
                                        ) : tasks.map((task) => (
                                            <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 font-semibold text-slate-700">{task.title}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={`font-medium px-2 py-0.5 ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                            className={`font-semibold text-xs border-0 bg-transparent focus:ring-0 cursor-pointer ${getStatusColor(task.status)}`}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Completed">Completed</option>
                                                        </select>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px] text-blue-600 hover:bg-blue-50"
                                                            onClick={() => setLoggingTask(task)}
                                                        >
                                                            Log Time
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                                    {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Weekly Overview Chart */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" /> Weekly Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 pb-4">
                            <div className="flex items-end justify-between h-48 gap-2 pt-4">
                                {weeklyAttendance.length > 0 ? weeklyAttendance.map((item, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full">
                                        <div className="flex-1 w-full bg-slate-50 rounded-t flex flex-col justify-end">
                                            <div
                                                className={`w-full ${item.isToday ? 'bg-blue-600' : 'bg-blue-600/10'} hover:bg-blue-600 transition-all rounded-t relative group`}
                                                style={{ height: `${Math.min((item.hours / 9) * 100, 100)}%` }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {item.hours.toFixed(1)} hrs
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold ${item.isToday ? 'text-blue-600' : 'text-slate-400'} uppercase tracking-tighter`}>{item.day}</span>
                                    </div>
                                )) : (
                                    [1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="flex-1 bg-slate-50 rounded-t h-full animate-pulse" />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* 3. Upcoming Deadlines Panel */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-lg font-bold text-slate-900">Upcoming Deadlines</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map((task) => (
                                    <div key={task._id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group cursor-pointer">
                                        <div>
                                            <h5 className="text-sm font-bold text-slate-700">{task.title}</h5>
                                            <p className="text-xs text-slate-500 mt-0.5">Project Assignment</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-800">
                                                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors ml-auto mt-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    {/* 5. Daily Report Section */}
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-900">EOD Report</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-blue-600 font-bold text-[11px] uppercase tracking-wider hover:bg-blue-50"
                                onClick={() => setReport({ achievements: 'Completed daily tasks and session tracking integration.', challenges: 'Minor port conflict resolved.', tomorrowPlan: 'Focus on Admin Analytics dashboard.' })}
                            >
                                Auto-Fill
                            </Button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Achievements</label>
                                <textarea
                                    value={report.achievements}
                                    onChange={(e) => setReport({ ...report, achievements: e.target.value })}
                                    className="w-full min-h-[80px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    placeholder="What did you accomplish today?"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Challenges</label>
                                <textarea
                                    value={report.challenges}
                                    onChange={(e) => setReport({ ...report, challenges: e.target.value })}
                                    className="w-full min-h-[60px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    placeholder="Any blockers or issues?"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tomorrow's Plan</label>
                                <textarea
                                    value={report.tomorrowPlan}
                                    onChange={(e) => setReport({ ...report, tomorrowPlan: e.target.value })}
                                    className="w-full min-h-[60px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    placeholder="Next priority focus items"
                                />
                            </div>
                            <Button
                                onClick={handleReportSubmit}
                                disabled={isSubmittingReport}
                                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold h-10 shadow-sm transition-all mt-2"
                            >
                                {isSubmittingReport ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Submit Daily Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Task Logging Modal */}
            {
                loggingTask && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md shadow-xl border-slate-200">
                            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">Log Task Time</CardTitle>
                                    <CardDescription className="text-xs">{loggingTask.title}</CardDescription>
                                </div>
                                <button onClick={() => setLoggingTask(null)} className="text-slate-400 hover:text-slate-600 font-bold">&#10005;</button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleLogTime} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Time Spent (Minutes)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={logMinutes}
                                            onChange={(e) => setLogMinutes(Number(e.target.value))}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Description / Notes</label>
                                        <textarea
                                            value={logDesc}
                                            onChange={(e) => setLogDesc(e.target.value)}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px]"
                                            placeholder="What did you work on specifically?"
                                            required
                                        />
                                    </div>
                                    <div className="pt-4 flex items-center justify-end gap-3">
                                        <button type="button" onClick={() => setLoggingTask(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={isLogging}
                                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700 flex items-center"
                                        >
                                            {isLogging ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                            Save Log
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
