'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Briefcase,
    CheckSquare,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    MoreHorizontal,
    Activity,
    Loader2
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const ATTENDANCE_DATA = [
    { name: 'Mon', value: 35 },
    { name: 'Tue', value: 45 },
    { name: 'Wed', value: 40 },
    { name: 'Thu', value: 50 },
    { name: 'Fri', value: 55 },
    { name: 'Sat', value: 20 },
    { name: 'Sun', value: 15 },
];

const DONUT_DATA = [
    { name: 'Present', value: 65 },
    { name: 'Late', value: 20 },
    { name: 'Absent', value: 15 },
];

const COLORS = ['#2563EB', '#F59E0B', '#DC2626'];

interface WorkforceMember {
    id: string;
    name: string;
    role: string;
    status: string;
    workedToday: string;
    remaining: string;
    productivity: number;
    userId?: string;
    email?: string;
    department?: string;
    joiningDate?: string;
    reportingTo?: any;
    workLocation?: string;
    isActive?: boolean;
}

interface AnalyticsData {
    attendanceData: { name: string; value: number; color: string }[];
    weeklyActivity: { name: string; hours: number }[];
}

interface TaskData {
    _id: string;
    title: string;
    status: string;
    priority: string;
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
    };
    dueDate?: string;
}

export default function AdminDashboard() {
    const { socket } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeProjects: 0,
        tasksInProgress: 0,
        completedTasks: 0
    });
    const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        attendanceData: [],
        weeklyActivity: []
    });
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [taskFilter, setTaskFilter] = useState('In Progress');
    const [editingEmployee, setEditingEmployee] = useState<WorkforceMember | null>(null);

    const handleUpdateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;

        try {
            await api.put(`/admin/workforce/${editingEmployee.id}`, {
                role: editingEmployee.role,
                department: editingEmployee.department,
                joiningDate: editingEmployee.joiningDate,
                workLocation: editingEmployee.workLocation,
                isActive: editingEmployee.isActive,
                email: editingEmployee.email
            });

            // Re-fetch or locally update
            setWorkforce(prev => prev.map(emp => emp.id === editingEmployee.id ? editingEmployee : emp));
            setEditingEmployee(null);
            alert('Employee profile updated successfully.');
        } catch (error) {
            console.error('Failed to update employee:', error);
            alert('Error updating profile.');
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, workforceRes, analyticsRes, tasksRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/workforce'),
                    api.get('/admin/analytics'),
                    api.get('/task/admin/all')
                ]);

                setStats(statsRes.data.stats);
                setWorkforce(workforceRes.data.workforce);
                setAnalytics(analyticsRes.data);
                setTasks(tasksRes.data.tasks);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
        // Set up polling for real-time feel (every 30s) as fallback
        const interval = setInterval(fetchDashboardData, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Dedicated useEffect strictly for reacting to Live Socket Emissions
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: { userId: string, isOnline: boolean, lastActive: string }) => {
            console.log('[Socket] Received employeeStatusUpdated:', data);
            setWorkforce(prev => {
                const updated = prev.map(emp => {
                    if (emp.id === data.userId || emp.userId === data.userId) {
                        console.log(`[Socket] Mapping status for ${emp.name} to ${data.isOnline ? 'Online' : 'Offline'}`);
                        return { ...emp, status: data.isOnline ? 'Online' : 'Offline' };
                    }
                    return emp;
                });
                return updated;
            });

            // Re-render slight animation or update numbers broadly
            setStats(prev => ({ ...prev }));
        };

        socket.on('employeeStatusUpdated', handleStatusUpdate);

        return () => {
            socket.off('employeeStatusUpdated', handleStatusUpdate);
        };
    }, [socket]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Executive Summary</h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time enterprise metrics and workspace overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Employees', value: stats.totalEmployees, growth: '+4.2%', icon: Users, up: true },
                    { label: 'Active Projects', value: stats.activeProjects, growth: '+2', icon: Briefcase, up: true },
                    { label: 'Tasks In Progress', value: stats.tasksInProgress, growth: '-12%', icon: Clock, up: false },
                    { label: 'Completed Tasks', value: stats.completedTasks, growth: '+24', icon: CheckSquare, up: true },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm border-0 ring-1 ring-slate-200 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                                        <span className={`text-[10px] font-bold flex items-center ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                                            {stat.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                            {stat.growth}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                                <div className={`h-full ${i % 2 === 0 ? 'bg-blue-600' : 'bg-slate-400'} opacity-20`} style={{ width: '40%' }}></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Employee Status Table (8 cols) */}
                <Card className="lg:col-span-8 border-slate-200 shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800">Workforce Status</CardTitle>
                            <CardDescription className="text-xs">Live monitoring of team activity</CardDescription>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4">Worked Today</th>
                                        <th className="px-6 py-4">Productivity</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {workforce.length > 0 ? workforce.map((emp, i) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white ring-1 ring-slate-100 uppercase">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{emp.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{emp.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className={`px-2 py-0.5 text-[9px] font-bold ${emp.status === 'Online' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full mr-1.5 ${emp.status === 'Online' ? 'bg-green-600' : 'bg-slate-400'}`}></span>
                                                    {emp.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="text-xs font-bold text-slate-600">{emp.workedToday}</span>
                                            </td>
                                            <td className="px-6 py-4 min-w-[140px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full ${emp.productivity > 80 ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${emp.productivity}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">{emp.productivity}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className="text-slate-300 hover:text-slate-500"
                                                    onClick={() => setEditingEmployee(emp)}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">No employees found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Overview (4 cols) */}
                <Card className="lg:col-span-4 border-slate-200 shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-800">Tasks Pipeline</CardTitle>
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-0 text-[10px] font-bold">This Week</Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {[
                            { label: 'Todo', count: tasks.filter(t => t.status === 'Pending').length, total: tasks.length, color: 'bg-slate-100' },
                            { label: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length, total: tasks.length, color: 'bg-blue-600 opacity-60' },
                            { label: 'Completed', count: tasks.filter(t => t.status === 'Completed').length, total: tasks.length, color: 'bg-blue-600' },
                        ].map((item, i) => {
                            const percent = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{item.count}/{item.total} <span className="text-slate-900 ml-1">{percent}%</span></span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="pt-4 border-t border-slate-50">
                            <div className="flex items-center justify-between text-xs mb-4">
                                <span className="font-bold text-slate-900">Weekly Achievement</span>
                                <span className="text-blue-600 font-bold">
                                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1 justify-between">
                                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                    <div key={day} className={`w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold ${day < 6 ? 'text-blue-600' : 'text-slate-300'}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Summary - Donut (4 cols) */}
                <Card className="lg:col-span-4 border-slate-200 shadow-sm ring-1 ring-slate-200 flex flex-col h-full">
                    <CardHeader className="py-5 px-6 border-b border-slate-50">
                        <CardTitle className="text-base font-bold text-slate-800">Attendance Mix</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.attendanceData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.attendanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Analytics - Bar (8 cols) */}
                <Card className="lg:col-span-8 border-slate-200 shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800">Productivity Analytics</CardTitle>
                            <CardDescription className="text-xs">Task completion trends over 7 days</CardDescription>
                        </div>
                        <Activity className="w-5 h-5 text-slate-300" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-72 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.weeklyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Progress Section (12 cols) */}
                <Card className="lg:col-span-12 border-slate-200 shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50">
                        <div className="flex md:flex-row flex-col md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800">Projects Milestones</CardTitle>
                                <CardDescription className="text-xs">Tracking global project lifecycle progress</CardDescription>
                            </div>
                            <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                                {['Pending', 'In Progress', 'Completed'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setTaskFilter(tab)}
                                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${taskFilter === tab ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {tasks.filter(t => taskFilter === 'All' || t.status === taskFilter).length > 0 ? tasks.filter(t => taskFilter === 'All' || t.status === taskFilter).slice(0, 4).map((task) => (
                                <Card key={task._id} className="border-slate-100 shadow-none bg-slate-50/50 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-blue-100 transition-all cursor-pointer">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <h4 className="text-sm font-bold text-slate-800 leading-snug truncate pr-2" title={task.title}>{task.title}</h4>
                                            <Badge className={`text-[8px] px-1.5 h-4 border-0 ${task.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {task.priority || 'Medium'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-white uppercase">
                                                {task.assignedTo?.name.charAt(0) || '?'}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 truncate">{task.assignedTo?.name || 'Unassigned'}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span className="text-slate-400 uppercase tracking-widest">Status</span>
                                                <span className="text-slate-900">{task.status}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                                <div className={`h-full ${task.status === 'Completed' ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: task.status === 'Completed' ? '100%' : '40%' }}></div>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                                <Clock className="w-3 h-3" /> Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                            </div>
                                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="col-span-4 py-8 text-center text-slate-400 text-xs italic">No {taskFilter.toLowerCase()} projects found</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Edit Employee Modal */}
            {editingEmployee && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-xl shadow-blue-900/10 border-slate-200">
                        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">Edit Employee Profile</CardTitle>
                                <CardDescription className="text-xs">Update {editingEmployee.name}'s system permissions and details</CardDescription>
                            </div>
                            <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600 font-bold">&#10005;</button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleUpdateEmployee} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Role</label>
                                        <select
                                            value={editingEmployee.role}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Developer">Developer</option>
                                            <option value="Tester">Tester</option>
                                            <option value="UI/UX">UI/UX</option>
                                            <option value="Sales">Sales</option>
                                            <option value="HR">HR</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
                                        <input
                                            type="text"
                                            value={editingEmployee.department || ''}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Joining Date</label>
                                        <input
                                            type="date"
                                            value={editingEmployee.joiningDate ? new Date(editingEmployee.joiningDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, joiningDate: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Work Location</label>
                                        <select
                                            value={editingEmployee.workLocation || 'Hybrid'}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, workLocation: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="On-site">On-site</option>
                                            <option value="Remote">Remote</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Email</label>
                                        <input
                                            type="email"
                                            value={editingEmployee.email || ''}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Reporting To</label>
                                        <select
                                            value={typeof editingEmployee.reportingTo === 'object' ? editingEmployee.reportingTo?._id : (editingEmployee.reportingTo || '')}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, reportingTo: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">None</option>
                                            {workforce.filter(w => w.role === 'Admin' || w.role === 'Manager').map(manager => (
                                                <option key={manager.id} value={manager.id}>{manager.name} ({manager.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingEmployee.isActive}
                                            onChange={(e) => setEditingEmployee({ ...editingEmployee, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-slate-800">Account Active</span>
                                    </label>
                                    <p className="text-[10px] text-slate-400">Uncheck to deactivate the user's account and revoke portal access.</p>
                                </div>
                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button type="button" onClick={() => setEditingEmployee(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700">Save Changes</button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
