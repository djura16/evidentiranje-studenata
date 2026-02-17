import { useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Attendance } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined') return ''; // same-origin → Vite proxy
  return API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5001';
};

const NEW_HIGHLIGHT_MS = 3000;

export interface LiveAttendance extends Attendance {
  _isNew?: boolean;
}

interface UseAttendanceSocketOptions {
  classSessionId: string | undefined;
  initialAttendances: Attendance[];
  enabled?: boolean;
}

/**
 * Hook za live ažuriranje liste prisustava preko WebSocket-a.
 * Vraća merge-ovanu listu (API + nove sa soketa) sortiranu po timestamp-u.
 * Novi zapisi imaju _isNew: true za animaciju (traje 3s).
 */
export function useAttendanceSocket({
  classSessionId,
  initialAttendances,
  enabled = true,
}: UseAttendanceSocketOptions): LiveAttendance[] {
  const [socketAdditions, setSocketAdditions] = useState<Attendance[]>([]);
  const [recentlyNewIds, setRecentlyNewIds] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!classSessionId || !enabled) return;

    const socket = io(`${getSocketUrl()}/attendance`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-class', { classSessionId });
    });

    socket.on('attendance:new', (data: { attendance: Attendance }) => {
      const att = data.attendance;
      setSocketAdditions((prev) => {
        if (prev.some((a) => a.id === att.id)) return prev;
        return [...prev, att];
      });
      setRecentlyNewIds((prev) => new Set(prev).add(att.id));
    });

    return () => {
      socket.emit('leave-class', { classSessionId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classSessionId, enabled]);

  useEffect(() => {
    if (recentlyNewIds.size === 0) return;
    const t = setTimeout(() => {
      setRecentlyNewIds(new Set());
    }, NEW_HIGHLIGHT_MS);
    return () => clearTimeout(t);
  }, [recentlyNewIds]);

  return useMemo(() => {
    const baseIds = new Set(initialAttendances.map((a) => a.id));
    const additions = socketAdditions.filter((a) => !baseIds.has(a.id));
    const merged: LiveAttendance[] = [
      ...initialAttendances.map((a) => ({
        ...a,
        _isNew: recentlyNewIds.has(a.id),
      })),
      ...additions.map((a) => ({
        ...a,
        _isNew: recentlyNewIds.has(a.id),
      })),
    ].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return merged;
  }, [initialAttendances, socketAdditions, recentlyNewIds]);
}
