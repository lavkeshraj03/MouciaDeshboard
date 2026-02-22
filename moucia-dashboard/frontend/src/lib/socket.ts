import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://mouciadeshboard.onrender.com'; // Production URL fallback

let socket: Socket | null = null;

export const initSocket = (token: string) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            auth: {
                token
            }
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
