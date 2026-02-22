'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CheckSquare,
    Filter,
    Search,
    Plus,
    Clock,
    Trash2,
    User,
    Loader2,
    Calendar,
    ChevronDown,
    AlertCircle
} from 'lucide-react';
import api from '@/services/api';

interface Task {
    _id: string;
    title: string;
    description: string;
    assignedTo: {
        _id: string;
        name: string;
    };
    status: string;
    priority: string;
    dueDate: string;
}

interface Employee {
    id: string;
    name: string;
}

export default function AdminTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        dueDate: ''
    });

    const fetchData = async () => {
        try {
            const [tasksRes, employeesRes] = await Promise.all([
                api.get('/task/admin/all'),
                api.get('/admin/workforce')
            ]);
            setTasks(tasksRes.data.tasks);
            setEmployees(employeesRes.data.workforce);
        } catch (error) {
            console.error('Error fetching task data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.assignedTo) return;

        setIsCreating(true);
        try {
            await api.post('/task/admin', newTask);
            setNewTask({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error creating task:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.delete(`/task/admin/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Task Governance</h2>
                    <p className="text-slate-500 text-sm mt-1">Centralized task assignment and status monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold h-10 px-6 shadow-sm border-0"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Assign New Task
                    </Button>
                </div>
            </div>

            {/* Create Task Form */}
            {showForm && (
                <Card className="border-blue-100 bg-blue-50/30 overflow-hidden ring-1 ring-blue-100 animate-in slide-in-from-top duration-300">
                    <CardHeader className="py-4 border-b border-blue-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-blue-900">Create New Assignment</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-blue-600">Cancel</Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1.5 lg:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Title</label>
                                <input
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="e.g., Update system documentation"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assign To</label>
                                <select
                                    required
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                                />
                            </div>
                            <div className="flex items-end lg:col-span-1">
                                <Button
                                    disabled={isCreating}
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-sm transition-all"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Assignment"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Task List Table */}
            <Card className="border-slate-200 shadow-sm border-0 ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="py-5 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800">System Tasks Pipeline</CardTitle>
                        <CardDescription className="text-xs">Monitoring {tasks.length} total active assignments</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Assignment</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4 text-center">Priority</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Deadline</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tasks.length > 0 ? tasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="max-w-md">
                                                <p className="text-sm font-bold text-slate-700 truncate">{task.title}</p>
                                                {task.description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{task.description}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                    {task.assignedTo?.name.charAt(0) || '?'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{task.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className={`px-2 py-0.5 text-[9px] font-bold ${task.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                {task.priority || 'Medium'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'Completed' ? 'bg-green-500' :
                                                        task.status === 'In Progress' ? 'bg-blue-500' :
                                                            'bg-slate-300'
                                                    }`}></span>
                                                <span className="text-[11px] font-bold text-slate-700">{task.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteTask(task._id)}
                                                className="text-slate-300 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            No tasks found in the pipeline
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
