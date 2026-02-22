import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { initSocket, disconnectSocket } from '@/lib/socket';

export const useSocket = (user: any, token: string | null) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (user && token) {
            // Initialize the single socket instance with our JWT
            const socketInstance = initSocket(token);
            setSocket(socketInstance);
        } else {
            // Unmount/logout cleanup
            disconnectSocket();
            setSocket(null);
        }

        // We specifically don't want to disconnect on every re-render or hook unmount,
        // we only disconnect when user genuinely logs out (when user/token becomes null).
    }, [user, token]);

    return socket;
};
