import { useQuery } from '@tanstack/react-query';
import { classesApi, attendanceApi, enrollmentsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { useState } from 'react';

const AttendancePage: React.FC = () => {
  const { hasRole } = useAuthContext();
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classesApi.getAll().then((res) => res.data),
  });

  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances', selectedClassId],
    queryFn: () =>
      attendanceApi.getByClass(selectedClassId!).then((res) => res.data),
    enabled: !!selectedClassId,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', selectedClassId],
    queryFn: () => {
      if (!selectedClassId || !classes) return [];
      const classSession = classes.find((c) => c.id === selectedClassId);
      if (!classSession?.subjectId) return [];
      return enrollmentsApi
        .getBySubject(classSession.subjectId)
        .then((res) => res.data);
    },
    enabled: !!selectedClassId && !!classes,
  });

  if (!hasRole(UserRole.TEACHER)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (classesLoading) {
    return <LoadingSpinner />;
  }

  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Prisustva po času
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista časova */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Časovi
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {classes && classes.length > 0 ? (
                classes.map((classSession) => (
                  <div
                    key={classSession.id}
                    onClick={() => setSelectedClassId(classSession.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClassId === classSession.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800 dark:text-white">
                        {classSession.subject?.name || 'Nepoznat predmet'}
                      </h3>
                      {classSession.isActive && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          Aktivan
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(classSession.startTime), 'dd.MM.yyyy', {
                            locale: sr,
                          })}
                        </span>
                      </div>
                      <div className="mt-1">
                        {format(new Date(classSession.startTime), 'HH:mm', {
                          locale: sr,
                        })}{' '}
                        -{' '}
                        {format(new Date(classSession.endTime), 'HH:mm', {
                          locale: sr,
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nema časova
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Detalji prisustva */}
        <div className="lg:col-span-2">
          {selectedClassId ? (
            <div className="space-y-6">
              {attendancesLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {selectedClass?.subject?.name}
                      </h2>
                      <button
                        onClick={() => navigate(`/teacher/classes/${selectedClassId}`)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Detalji časa →
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {format(new Date(selectedClass!.startTime), 'dd.MM.yyyy HH:mm', {
                        locale: sr,
                      })}{' '}
                      -{' '}
                      {format(new Date(selectedClass!.endTime), 'HH:mm', {
                        locale: sr,
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            Prisutni
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {attendances?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            Upisani
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                          {enrollments?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                        Lista prisustva
                      </h3>
                      <div className="space-y-2">
                        {attendances && attendances.length > 0 ? (
                          attendances.map((attendance) => (
                            <div
                              key={attendance.id}
                              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {attendance.student?.firstName}{' '}
                                  {attendance.student?.lastName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {format(
                                    new Date(attendance.timestamp),
                                    'dd.MM.yyyy HH:mm:ss',
                                    { locale: sr },
                                  )}
                                </p>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Nema evidentiranih prisustava
                          </p>
                        )}
                      </div>
                    </div>

                    {enrollments && enrollments.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                          Upisani studenti koji nisu prisustvovali
                        </h3>
                        <div className="space-y-2">
                          {enrollments
                            .filter(
                              (enrollment) =>
                                !attendances?.some(
                                  (attendance) =>
                                    attendance.studentId === enrollment.studentId,
                                ),
                            )
                            .map((enrollment) => (
                              <div
                                key={enrollment.id}
                                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">
                                    {enrollment.student?.firstName}{' '}
                                    {enrollment.student?.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {enrollment.student?.email}
                                  </p>
                                </div>
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Izaberite čas da vidite prisustva
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
