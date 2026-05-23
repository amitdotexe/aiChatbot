import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io("https://aichatbot-1a16.onrender.com", {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  console.log("SETTING SOCKET AUTH TOKEN:", token);
  socket.auth = { token };

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
