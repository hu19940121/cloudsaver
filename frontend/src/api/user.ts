import request from "@/utils/request";

export const userApi = {
  login: (data: { username: string; password: string; rememberMe?: boolean }) => {
    return request.post<Record<string, never>>("/api/user/login", data);
  },
  register: (data: { username: string; password: string; registerCode: string }) => {
    return request.post<{ userId: string; username: string; role: number }>("/api/user/register", data);
  },
  logout: () => request.post("/api/user/logout", {}),
  getSponsors: () => {
    return request.get("/api/sponsors?timestamp=" + Date.now());
  },
};
