import axios from "axios";

const api = axios.create({
  baseURL: "https://aichatbot-1a16.onrender.com",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const register = (data) => api.post("/api/auth/register", data);
export const login = (data) => api.post("/api/auth/login", data);
export const getChats = () => api.get("/api/chat");
export const createChat = (title) => api.post("/api/chat", { title });
export const getChatMessages = (chatId) =>
  api.get(`/api/chat/${chatId}/messages`);

export default api;
