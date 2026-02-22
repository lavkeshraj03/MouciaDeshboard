'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Mail,
    Shield,
    Key,
    Building2,
    Calendar,
    Briefcase,
    Globe,
    ExternalLink,
    Edit3,
    AlertCircle
} from 'lucide-react';
import { useAuth, User as GlobalUser } from '@/context/AuthContext';
import api from '@/services/api';

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<GlobalUser | null>(authUser);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.user) {
                    setUser(res.data.user);
                }
            } catch (err) {
                console.error('Failed to fetch fresh profile:', err);
            }
        };

        fetchProfile();
    }, []);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row items-center gap-6 pb-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl ring-1 ring-slate-200">
                    {user?.name?.charAt(0) || authUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-center md:text-left space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h2>
                    <p className="text-slate-500 font-medium">Senior {user?.role || 'Employee'}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                        <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 px-3 font-bold text-[10px] uppercase tracking-widest">
                            <Globe className="w-3 h-3 mr-1.5" /> {user?.workLocation || 'Remote'}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50 px-3 font-bold text-[10px] uppercase tracking-widest">
                            <Shield className="w-3 h-3 mr-1.5" /> ID Verified
                        </Badge>
                    </div>
                </div>
                <div className="md:ml-auto relative">
                    <Button asChild className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg transition-all shadow-md cursor-pointer">
                        <label>
                            <Edit3 className="w-4 h-4 mr-2" /> Edit Photo
                            <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        alert("Photo update functionality would process here.");
                                    }
                                }}
                            />
                        </label>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold">Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                    <Mail className="w-4 h-4 text-slate-300" /> {user?.email}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                                <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                    <Shield className="w-4 h-4 text-slate-300" /> MOU-2023-0492
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Location</p>
                                <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                    <Globe className="w-4 h-4 text-slate-300" /> {user?.workLocation || 'Hybrid'} (Local)
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold">Quick Links</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-md flex items-center justify-between">
                                Security Settings <ExternalLink className="w-3 h-3 text-slate-300" />
                            </button>
                            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-md flex items-center justify-between">
                                Privacy Policy <ExternalLink className="w-3 h-3 text-slate-300" />
                            </button>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-blue-600">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold">Employment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Role</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{user?.role}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{user?.department || 'Engineering'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joining Date</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">
                                                {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Feb 15, 2023'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting To</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{user?.reportingTo || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold">Security Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication</h4>
                                    <p className="text-xs text-slate-500">Secure your account with 2FA protection</p>
                                </div>
                                <Badge className="bg-slate-100 text-slate-500 border-0 pointer-events-none">Disabled</Badge>
                            </div>
                            <div className="h-px bg-slate-50 w-full"></div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
                                    <p className="text-xs text-slate-500">Contact your Administrator to reset your password.</p>
                                </div>
                                <Badge className="bg-slate-100 text-slate-500 border-0 pointer-events-none">Restricted</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
