import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_API_URL);
      return url.origin;
    } catch {
      return 'http://localhost:4000';
    }
  }
  return 'http://localhost:4000';
};

export const socket: Socket = io(getSocketUrl(), {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
