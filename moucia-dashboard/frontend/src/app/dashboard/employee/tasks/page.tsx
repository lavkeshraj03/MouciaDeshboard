'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    MoreHorizontal,
    CheckSquare,
    Clock,
    AlertCircle,
    ChevronDown,
    Plus,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

interface Task {
    _id: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Progress' | 'Completed';
    dueDate: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await api.get('/task');
                setTasks(response.data.tasks);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await api.put('/task/status', { taskId, status: newStatus });
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const filteredTasks = tasks.filter(t => filter === 'All' || t.status === filter);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-50 text-red-600 border-red-100';
            case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Low': return 'bg-slate-50 text-slate-600 border-slate-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed': return <CheckSquare className="w-4 h-4 text-green-600" />;
            case 'In Progress': return <Clock className="w-4 h-4 text-blue-600" />;
            default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Assignments</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Track and manage your project deliverables</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find a task..."
                            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 pb-2 overflow-x-auto no-scrollbar">
                {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filter === f
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                            <th className="px-6 py-4">Task Details</th>
                                            <th className="px-6 py-4">Priority</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Due Date</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                                                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Fetching Tasks...</p>
                                                </td>
                                            </tr>
                                        ) : filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No tasks found matching your filter.</td>
                                            </tr>
                                        ) : filteredTasks.map((task) => (
                                            <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">{task.title}</span>
                                                        <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description || 'No description provided.'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge variant="outline" className={`font-bold px-2 py-0.5 text-[10px] ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(task.status)}
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                            className="text-xs font-bold text-slate-700 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Completed">Completed</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm">
                                                    <span className="font-bold text-slate-600">
                                                        {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button className="text-slate-400 hover:text-slate-600">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
