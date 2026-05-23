import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  // always destroy old instance first
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  console.log("CREATING FRESH SOCKET WITH TOKEN:", token);

  socket = io("https://aichatbot-1a16.onrender.com", {
    auth: { token },
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
