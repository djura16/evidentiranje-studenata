import axios, { AxiosError } from 'axios';
import { UserRole, User } from '@evidentiranje/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodaje token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  indexNumber?: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      indexNumber?: string;
      role: UserRole;
      avatar?: string;
    };
}

// User type is imported from @evidentiranje/shared
export type { User };

export interface SubjectSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  repeatsWeekly?: boolean;
}

export interface SubjectTeacher {
  id: string;
  teacherId: string;
  teacher?: User;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacher?: User;
  subjectTeachers?: SubjectTeacher[];
  semesterStartDate?: string;
  semesterEndDate?: string;
  semesterType?: 'winter' | 'summer';
  academicYearStart?: number;
  schedules?: SubjectSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassSession {
  id: string;
  subjectId: string;
  subject?: Subject;
  startTime: string;
  endTime: string;
  qrCodeToken?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: User;
  classSessionId: string;
  classSession?: ClassSession;
  timestamp: string;
}

export interface DashboardStats {
  users?: {
    total: number;
    teachers: number;
    students: number;
    admins: number;
  };
  subjects?: {
    total: number;
    list?: Array<{ id: string; name: string }>;
  };
  classes?: {
    total: number;
  };
  attendances?: {
    total: number;
    percentage?: number;
  };
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),
};

// Users API
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: RegisterRequest) => api.post<User>('/users', data),
  update: (id: string, data: Partial<RegisterRequest>) =>
    api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getStatistics: () => api.get<DashboardStats>('/users/statistics'),
};

// Subjects API
export const subjectsApi = {
  getAll: () => api.get<Subject[]>('/subjects'),
  getById: (id: string) => api.get<Subject>(`/subjects/${id}`),
  create: (data: {
    name: string;
    description?: string;
    teacherId?: string;
    teacherIds?: string[];
    semesterType?: 'winter' | 'summer';
    academicYearStart?: number;
    semesterStartDate?: string;
    semesterEndDate?: string;
    schedules?: SubjectSchedule[];
  }) => api.post<Subject>('/subjects', data),
  update: (id: string, data: Partial<Subject> & { teacherIds?: string[] }) =>
    api.patch<Subject>(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

// Classes API
export interface ClassesQueryParams {
  subjectId?: string;
  heldOnly?: boolean;
  limit?: number;
  offset?: number;
}

export const classesApi = {
  countHeld: (subjectId?: string) =>
    api.get<number>(
      `/classes/count-held${subjectId ? `?subjectId=${subjectId}` : ''}`,
    ).then((res) => res.data),
  getAll: (params?: ClassesQueryParams) => {
    const search = new URLSearchParams();
    if (params?.subjectId) search.set('subjectId', params.subjectId);
    if (params?.heldOnly) search.set('heldOnly', 'true');
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.offset != null) search.set('offset', String(params.offset));
    const qs = search.toString();
    return api.get<ClassSession[]>(`/classes${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => api.get<ClassSession>(`/classes/${id}`),
  create: (data: {
    subjectId: string;
    startTime: string;
    endTime: string;
  }) => api.post<ClassSession>('/classes', data),
  update: (id: string, data: Partial<ClassSession>) =>
    api.patch<ClassSession>(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
  activate: (id: string, expirationMinutes?: number) =>
    api.post<ClassSession & { qrCodeUrl: string }>(`/classes/${id}/activate`, {
      expirationMinutes,
    }),
  deactivate: (id: string) =>
    api.post<ClassSession>(`/classes/${id}/deactivate`),
};

// Attendance API
export const attendanceApi = {
  scan: (token: string) =>
    api.post<Attendance>('/attendance/scan', {}, {
      params: { token },
    }),
  getMy: () => api.get<Attendance[]>('/attendance/my'),
  getByClass: (classSessionId: string) =>
    api.get<Attendance[]>(`/attendance/class/${classSessionId}`),
  getByStudent: (studentId: string) =>
    api.get<Attendance[]>(`/attendance/student/${studentId}`),
  getStatistics: (subjectId: string) =>
    api.get<{
      subjectId: string;
      totalClasses: number;
      classDates: string[];
      statistics: Array<{
        student: User;
        attendedClasses: number;
        totalClasses: number;
        attendancePercentage: number;
        attendedDates: string[];
      }>;
    }>(`/attendance/statistics/${subjectId}`),
};

// Statistics API
export const statisticsApi = {
  getDashboard: () => api.get<DashboardStats>('/statistics/dashboard'),
};

// Enrollments API
export interface Enrollment {
  id: string;
  studentId: string;
  student?: User;
  subjectId: string;
  subject?: Subject;
  enrolledAt: string;
}

export const enrollmentsApi = {
  getMy: () => api.get<Enrollment[]>('/enrollments/my'),
  getBySubject: (subjectId: string) =>
    api.get<Enrollment[]>(`/enrollments/subject/${subjectId}`),
  adminEnroll: (subjectId: string, studentId: string) =>
    api.post<Enrollment>(`/enrollments/admin/subject/${subjectId}/student/${studentId}`),
  adminUnenroll: (subjectId: string, studentId: string) =>
    api.delete(`/enrollments/admin/subject/${subjectId}/student/${studentId}`),
  bulkEnrollByYear: (subjectId: string, enrollmentYear: number) =>
    api.post<{ enrolled: number }>(`/enrollments/admin/subject/${subjectId}/bulk-by-year`, {
      enrollmentYear,
    }),
  bulkUnenrollByYear: (subjectId: string, enrollmentYear: number) =>
    api.post<{ unenrolled: number }>(
      `/enrollments/admin/subject/${subjectId}/bulk-unenroll-by-year`,
      { enrollmentYear },
    ),
};
