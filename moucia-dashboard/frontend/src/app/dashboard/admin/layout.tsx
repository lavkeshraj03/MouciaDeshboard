'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect if role is set and is not Admin
        if (user && user.role !== 'Admin') {
            router.push('/dashboard/employee');
        }
    }, [user, router]);

    // If user is absent or not Admin, we return null to prevent flashing the admin UI
    if (!user || user.role !== 'Admin') {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
