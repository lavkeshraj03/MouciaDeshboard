'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users,
    UserPlus,
    Search,
    Mail,
    MoreHorizontal,
    Clock,
    Activity,
    Loader2,
    Shield
} from 'lucide-react';
import api from '@/services/api';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    workedToday: string;
    productivity: number;
    department?: string;
    joiningDate?: string;
    reportingTo?: any;
    workLocation?: string;
    isActive?: boolean;
}

export default function AdminEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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
                email: editingEmployee.email,
                reportingTo: editingEmployee.reportingTo?._id || editingEmployee.reportingTo
            });

            // Re-fetch or locally update
            setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? editingEmployee : emp));
            setEditingEmployee(null);
            alert('Employee profile updated successfully.');
        } catch (error) {
            console.error('Failed to update employee:', error);
            alert('Error updating profile.');
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/admin/workforce');
                setEmployees(res.data.workforce);
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Employee Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage and monitor workforce records</p>
                </div>
                <Button className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold h-10 px-6 shadow-sm border-0 transition-all">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm border-0 ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="py-5 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, role, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all font-sans"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 px-3 py-1">
                            {filteredEmployees.length} Members
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Workload</th>
                                    <th className="px-6 py-4">Productivity</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{emp.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Shield className="w-3 h-3 text-slate-300" />
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="text-xs">{emp.email || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className={`px-2 py-0.5 text-[9px] font-bold ${emp.status === 'Online' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                <span className={`w-1 h-1 rounded-full mr-1.5 ${emp.status === 'Online' ? 'bg-green-600' : 'bg-slate-400'}`}></span>
                                                {emp.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                {emp.workedToday} today
                                            </div>
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
                                                className="text-slate-300 hover:text-slate-600 transition-colors"
                                                onClick={() => setEditingEmployee(emp)}
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            No matching employee records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

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
                                            {employees.filter(w => w.role === 'Admin' || w.role === 'Manager').map(manager => (
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
