export const API_ENDPOINTS = {
  ai: {
    generate: "/api/ai/generate",
  },
  quota: {
    status: "/api/quota/status",
    history: "/api/quota/history",
    upgrade: "/api/quota/upgrade",
  },
  users: {
    register: "/api/users/register",
    login: "/api/users/login",
  },
} as const
