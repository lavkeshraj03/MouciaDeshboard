'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Search, Calendar, Users, MoreHorizontal, Clock, Activity, Loader2 } from 'lucide-react';
import api from '@/services/api';

interface User {
    _id: string; // From mongoose populate
    id: string;  // From our unified response
    name: string;
    role: string;
    email: string;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    category: string;
    team: User[];
    status: string;
    dueDate: string | null;
    deliverableDate: string | null;
}

export default function AdminProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Web App',
        team: [] as string[],
        status: 'Pending',
        dueDate: '',
        deliverableDate: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, employeesRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/admin/workforce') // Reuse workforce endpoint to get users
                ]);
                setProjects(projectsRes.data.projects);
                setEmployees(employeesRes.data.workforce.map((emp: any) => ({
                    _id: emp.id,
                    id: emp.id,
                    name: emp.name,
                    role: emp.role,
                    email: emp.email
                })));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                title: project.title,
                description: project.description || '',
                category: project.category,
                team: project.team.map(u => u._id),
                status: project.status,
                dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
                deliverableDate: project.deliverableDate ? new Date(project.deliverableDate).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingProject(null);
            setFormData({
                title: '',
                description: '',
                category: 'Web App',
                team: [],
                status: 'Pending',
                dueDate: '',
                deliverableDate: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleTeamSelection = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            team: prev.team.includes(userId)
                ? prev.team.filter(id => id !== userId)
                : [...prev.team, userId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject) {
                const res = await api.put(`/projects/${editingProject._id}`, formData);
                setProjects(prev => prev.map(p => p._id === editingProject._id ? res.data.project : p));
            } else {
                const res = await api.post('/projects', formData);
                setProjects(prev => [res.data.project, ...prev]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save project:', error);
            alert('Failed to save project');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'Delivered': return 'bg-blue-100 text-blue-700';
            case 'In Progress': return 'bg-amber-100 text-amber-700';
            case 'On Hold': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
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
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Project Portfolio</h2>
                    <p className="text-slate-500 text-sm mt-1">Global project tracking and lifecycle management</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm border-0 transition-all flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all font-sans"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1.5 shadow-sm">
                        {filteredProjects.length} Projects
                    </Badge>
                </div>
            </div>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.length > 0 ? filteredProjects.map((project) => (
                    <Card key={project._id} className="border-slate-200 shadow-sm border-0 ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-200 transition-all flex flex-col group">
                        <CardHeader className="p-5 border-b border-slate-50 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200">
                                    {project.category}
                                </Badge>
                                <button onClick={() => handleOpenModal(project)} className="text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-3">
                                <CardTitle className="text-base font-bold text-slate-900 leading-tight">{project.title}</CardTitle>
                                <CardDescription className="text-xs mt-1.5 line-clamp-2 text-slate-500">
                                    {project.description || "No description provided."}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-between space-y-4">

                            {/* Dates */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due
                                    </span>
                                    <span className="font-bold text-slate-700">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Deliverable
                                    </span>
                                    <span className="font-bold text-slate-700">{project.deliverableDate ? new Date(project.deliverableDate).toLocaleDateString() : 'TBD'}</span>
                                </div>
                            </div>

                            {/* Team & Status */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex -space-x-2">
                                    {project.team.slice(0, 3).map((member, idx) => (
                                        <div key={member._id} className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white shadow-sm z-[${3 - idx}] bg-blue-${600 - (idx * 100)}`} title={member.name}>
                                            {member.name.charAt(0)}
                                        </div>
                                    ))}
                                    {project.team.length > 3 && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-600 bg-slate-100 border-2 border-white shadow-sm z-0">
                                            +{project.team.length - 3}
                                        </div>
                                    )}
                                    {project.team.length === 0 && (
                                        <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                                    )}
                                </div>
                                <Badge className={`px-2 py-0.5 text-[10px] font-bold border-0 shadow-none ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </Badge>
                            </div>

                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        <Briefcase className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-sm font-bold text-slate-600">No projects found</p>
                        <p className="text-xs">Try adjusting your filters or create a new project.</p>
                    </div>
                )}
            </div>

            {/* Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-2xl shadow-blue-900/10 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between px-6 py-4 shrink-0">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">{editingProject ? 'Edit Project' : 'Create New Project'}</CardTitle>
                                <CardDescription className="text-xs">Fill in the details for the project lifecycle</CardDescription>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200">✕</button>
                        </CardHeader>
                        <CardContent className="p-6 overflow-y-auto">
                            <form id="project-form" onSubmit={handleSubmit} className="space-y-6">

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Project Title *</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="e.g. Acme Corp Redesign"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                                            placeholder="Detailed description of deliverables..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Category</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                                placeholder="e.g. Web App, Marketing, Design"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Completed">Completed</option>
                                                <option value="On Hold">On Hold</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Due Date</label>
                                            <input
                                                type="date"
                                                value={formData.dueDate}
                                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Deliverable Date</label>
                                            <input
                                                type="date"
                                                value={formData.deliverableDate}
                                                onChange={e => setFormData({ ...formData, deliverableDate: e.target.value })}
                                                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block flex justify-between">
                                            <span>Assigned Team</span>
                                            <span className="text-blue-600">{formData.team.length} selected</span>
                                        </label>
                                        <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 shadow-inner">
                                            {employees.filter(e => e.role !== 'Admin').map(emp => (
                                                <label key={emp._id} className="flex items-center gap-3 p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 cursor-pointer transition-colors group">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.team.includes(emp._id)}
                                                            onChange={() => handleTeamSelection(emp._id)}
                                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700 shrink-0 uppercase">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col flex-1">
                                                        <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium">{emp.role}</span>
                                                    </div>
                                                </label>
                                            ))}
                                            {employees.filter(e => e.role !== 'Admin').length === 0 && (
                                                <p className="text-xs text-slate-400 text-center py-4">No employees found to assign.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" form="project-form" className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                {editingProject ? 'Save Changes' : 'Create Project'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
