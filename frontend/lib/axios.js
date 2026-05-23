import axios from "axios";

const api = axios.create({
  baseURL: "https://aichatbot-1a16.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getChats = () => api.get("/chat");
export const createChat = (title) => api.post("/chat", { title });
export const getChatMessages = (chatId) => api.get(`/chat/${chatId}/messages`);

export default api;
