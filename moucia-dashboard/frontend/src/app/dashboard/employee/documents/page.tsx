'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    FileText,
    FileCode,
    FileArchive,
    Download,
    Search,
    FolderOpen,
    Shield
} from 'lucide-react';

export default function DocumentsPage() {
    const docs = [
        { name: 'Company Policy 2023.pdf', type: 'PDF', size: '2.4 MB', date: 'Jan 12, 2023' },
        { name: 'Employee Handbook.pdf', type: 'PDF', size: '5.1 MB', date: 'Jan 15, 2023' },
        { name: 'Benefit Summary.docx', type: 'DOCX', size: '1.2 MB', date: 'Feb 05, 2023' },
        { name: 'Training Material.zip', type: 'ZIP', size: '125 MB', date: 'Oct 01, 2023' },
    ];

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Corporate policies, handbooks, and resource materials</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
                    <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-blue-600" /> Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1">
                        {['All Files', 'Policies', 'Invoices', 'Trainings', 'Templates'].map((cat, i) => (
                            <button key={i} className={`w-full text-left px-4 py-2 rounded-md text-xs font-bold transition-all ${i === 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                {cat}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <div className="lg:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-slate-200 shadow-sm bg-blue-600 text-white border-0">
                            <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">Secure Access</h4>
                                    <p className="text-[10px] text-blue-100 mt-1">End-to-end encrypted storage</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-blue-600">
                        <CardContent className="p-0">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Filename</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                                    {docs.map((doc, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                {doc.type === 'PDF' ? <FileText className="w-5 h-5 text-red-400" /> :
                                                    doc.type === 'ZIP' ? <FileArchive className="w-5 h-5 text-amber-400" /> :
                                                        <FileCode className="w-5 h-5 text-blue-400" />}
                                                <span className="font-bold text-slate-700">{doc.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 uppercase text-[10px] font-bold">{doc.type}</td>
                                            <td className="px-6 py-4 text-slate-500">{doc.size}</td>
                                            <td className="px-6 py-4 text-slate-500">{doc.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
