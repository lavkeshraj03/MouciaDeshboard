'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Building, Clock, ShieldCheck, MapPin, Loader2, Calendar } from 'lucide-react';
import api from '@/services/api';

interface SystemSettings {
    companyName: string;
    targetHours: number;
    minimumSessionBuffer: number;
    allowRemoteWork: boolean;
    requireLocationTracking: boolean;
    weeklyOffDays: string[];
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings');
                setSettings(res.data.settings);
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (field: keyof SystemSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await api.put('/admin/settings', settings);
            alert('Settings updated successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleOffDay = (day: string) => {
        if (!settings) return;
        const currentDays = settings.weeklyOffDays || [];
        if (currentDays.includes(day)) {
            handleChange('weeklyOffDays', currentDays.filter(d => d !== day));
        } else {
            handleChange('weeklyOffDays', [...currentDays, day]);
        }
    };

    if (isLoading || !settings) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Settings className="w-6 h-6 text-blue-600" /> System Settings
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Configure global application parameters and security</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 h-11 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Global Configuration Card */}
                <Card className="col-span-1 md:col-span-7 border-slate-200 shadow-sm border-0 ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" /> Organization Profile
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Company Registered Name</label>
                            <input
                                type="text"
                                value={settings.companyName}
                                disabled
                                className="w-full text-sm font-medium border border-slate-200 rounded-lg p-3 bg-slate-50 text-slate-500 cursor-not-allowed outline-none transition-all"
                            />
                            <p className="text-xs text-slate-400">Company name is currently fixed and cannot be edited.</p>
                        </div>

                    </CardContent>
                </Card>

                {/* Timing configuration */}
                <Card className="col-span-1 md:col-span-5 border-slate-200 shadow-sm border-0 ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" /> Shift Rules
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex justify-between">
                                Default Target Hours
                                <Badge variant="outline" className="text-[10px] bg-slate-50">{settings.targetHours} hrs</Badge>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={24}
                                value={settings.targetHours}
                                onChange={(e) => handleChange('targetHours', parseInt(e.target.value) || 8)}
                                className="w-full text-sm font-medium border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex justify-between">
                                Minimum Session Buffer
                                <Badge variant="outline" className="text-[10px] bg-slate-50">{settings.minimumSessionBuffer} mins</Badge>
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={settings.minimumSessionBuffer}
                                onChange={(e) => handleChange('minimumSessionBuffer', parseInt(e.target.value) || 120)}
                                className="w-full text-sm font-medium border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-400">Minimum continuous tracking block required to log attendance.</p>
                        </div>

                    </CardContent>
                </Card>

                {/* Compliance configuration */}
                <Card className="col-span-1 md:col-span-12 border-slate-200 shadow-sm border-0 ring-1 ring-slate-200">
                    <CardHeader className="py-5 px-6 border-b border-slate-50">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-slate-400" /> Attendance & Security Compliance
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                            {/* Toggle Policies */}
                            <div className="space-y-6 md:pr-4">
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            type="checkbox"
                                            checked={settings.allowRemoteWork}
                                            onChange={(e) => handleChange('allowRemoteWork', e.target.checked)}
                                            className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">Allow Remote Work Logging</span>
                                        <span className="text-xs text-slate-500 mt-1">If disabled, employees must log in from the designated office IPs or locations.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            type="checkbox"
                                            checked={settings.requireLocationTracking}
                                            onChange={(e) => handleChange('requireLocationTracking', e.target.checked)}
                                            className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            Strict Location Auditing <MapPin className="w-3 h-3 text-slate-400" />
                                        </span>
                                        <span className="text-xs text-slate-500 mt-1">Forces browser GPS pin during clock-in. Browsers blocking tracking will reject access.</span>
                                    </div>
                                </label>
                            </div>

                            {/* Weekly off */}
                            <div className="space-y-4 pt-6 md:pt-0 md:pl-8">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Corporate Weekly Off Days
                                </label>
                                <p className="text-xs text-slate-400 mb-4">Select the default non-working days for automatic shift exclusion.</p>

                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => {
                                        const isSelected = settings.weeklyOffDays?.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => toggleOffDay(day)}
                                                type="button"
                                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isSelected
                                                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300 shadow-sm'
                                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 ring-1 ring-slate-200'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
