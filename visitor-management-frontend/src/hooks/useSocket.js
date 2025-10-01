// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(onNotification) {
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io('http://localhost:8080');

        socketRef.current.on('notification', (data) => {
            onNotification(data);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [onNotification]);

    return socketRef.current;
}
