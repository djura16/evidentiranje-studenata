import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import SubjectsPage from './pages/Teacher/SubjectsPage';
import ClassesPage from './pages/Teacher/ClassesPage';
import ClassDetailPage from './pages/Teacher/ClassDetailPage';
import AttendancePage from './pages/Teacher/AttendancePage';
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentSubjects from './pages/Student/StudentSubjects';
import EnrollmentsPage from './pages/Student/EnrollmentsPage';
import StudentCalendar from './pages/Student/StudentCalendar';
import StudentAttendance from './pages/Student/StudentAttendance';
import QRScannerPage from './pages/Student/QRScannerPage';
import LoadingSpinner from './components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';

function App() {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Debug logging
  React.useEffect(() => {
    console.log('App render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/login" replace />} />
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="admin/users" 
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Teacher Routes */}
        <Route 
          path="teacher/dashboard" 
          element={
            <ProtectedRoute requiredRole={UserRole.TEACHER}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="teacher/subjects" 
          element={
            <ProtectedRoute requiredRole={UserRole.TEACHER}>
              <SubjectsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="teacher/classes" 
          element={
            <ProtectedRoute requiredRole={UserRole.TEACHER}>
              <ClassesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="teacher/classes/:id" 
          element={
            <ProtectedRoute requiredRole={UserRole.TEACHER}>
              <ClassDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="teacher/attendance" 
          element={
            <ProtectedRoute requiredRole={UserRole.TEACHER}>
              <AttendancePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Student Routes */}
        <Route 
          path="student/dashboard" 
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="student/subjects" 
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <StudentSubjects />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="student/enrollments" 
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <EnrollmentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="student/calendar" 
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <StudentCalendar />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="student/attendance" 
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <StudentAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="student/scan" 
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <QRScannerPage />
            </ProtectedRoute>
          } 
        />
        <Route path="attend" element={<QRScannerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
