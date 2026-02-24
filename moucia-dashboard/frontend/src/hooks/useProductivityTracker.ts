import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export type ActivityState = 'Active' | 'Idle' | 'Away';

/**
 * Tracks user activity (mouse, keyboard, scroll, tab visibility).
 * Transitions state and emits ping to the provided socket.
 */
export function useProductivityTracker(
    isActiveSession: boolean,
    socket: Socket | null,
    idleTimeoutMs = 180000, // 3 minutes defaults
    pingIntervalMs = 30000  // 30 seconds ping
) {
    const [currentState, setCurrentState] = useState<ActivityState>('Active');
    const stateRef = useRef<ActivityState>('Active');
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync state ref
    useEffect(() => {
        stateRef.current = currentState;
    }, [currentState]);

    // Handle user activity (Keyboard, Mouse, Click, Scroll)
    const handleUserActivity = () => {
        if (!isActiveSession) return;

        // If we are Away (tab hidden), do NOT mark active until they return
        if (document.visibilityState === 'hidden') return;

        // Reset user to Active if they were Idle
        if (stateRef.current === 'Idle') {
            setCurrentState('Active');
        }

        // Restart the idle countdown
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (document.visibilityState !== 'hidden') {
                setCurrentState('Idle');
            }
        }, idleTimeoutMs);
    };

    // Handle Tab Visibility (Away)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!isActiveSession) return;
            if (document.visibilityState === 'hidden') {
                setCurrentState('Away');
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            } else {
                setCurrentState('Active');
                handleUserActivity(); // Restart idle timer automatically
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isActiveSession, idleTimeoutMs]);

    // Bind Document Activity events
    useEffect(() => {
        if (!isActiveSession) {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(evt => document.addEventListener(evt, handleUserActivity, { passive: true }));

        // Initial setup
        handleUserActivity();

        return () => {
            events.forEach(evt => document.removeEventListener(evt, handleUserActivity));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [isActiveSession, idleTimeoutMs]);

    // WebSocket Ping Loop
    useEffect(() => {
        if (!isActiveSession || !socket) {
            if (pingTimerRef.current) clearInterval(pingTimerRef.current);
            return;
        }

        const transmitState = () => {
            socket.emit('userActivityPing', { state: stateRef.current });
            console.log(`[Tracker] Pinged state: ${stateRef.current}`);
        };

        pingTimerRef.current = setInterval(transmitState, pingIntervalMs);

        return () => {
            if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        };
    }, [isActiveSession, socket, pingIntervalMs]);

    return currentState;
}
