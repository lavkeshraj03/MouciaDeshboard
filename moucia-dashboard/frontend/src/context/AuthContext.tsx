'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import api from '../services/api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
    todayWorkedSeconds: number;
    department?: string;
    joiningDate?: string;
    reportingTo?: string;
    workLocation?: string;
    isActive?: boolean;
    profilePicture?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    socket: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    // Initialize Global WebSockets
    const socket = useSocket(user, token);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user from local storage');
            }
        }
    }, []);

    // Listen for live profile updates
    useEffect(() => {
        if (!socket) return;
        const handleProfileUpdate = (updatedData: any) => {
            if (user && updatedData.id === user.id) {
                console.log('[Socket] Profile Updated Real-Time', updatedData);

                // If account became inactive, immediately clear state and route to login
                if (updatedData.isActive === false) {
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                    alert('Your account has been deactivated by an Administrator.');
                    return;
                }

                const newUser = { ...user, ...updatedData };
                setUser(newUser);
                localStorage.setItem('user', JSON.stringify(newUser));
            }
        };

        socket.on('employeeProfileUpdated', handleProfileUpdate);
        return () => {
            socket.off('employeeProfileUpdated', handleProfileUpdate);
        };
    }, [socket, user]);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        if (userData.role === 'Admin') {
            router.push('/dashboard/admin');
        } else {
            router.push('/dashboard/employee');
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, socket }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
