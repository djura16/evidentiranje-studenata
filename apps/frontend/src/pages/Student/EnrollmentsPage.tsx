import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen, User, CheckCircle, Plus, X } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

const EnrollmentsPage: React.FC = () => {
  const { hasRole } = useAuthContext();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: availableSubjects, isLoading: availableLoading } = useQuery({
    queryKey: ['available-subjects'],
    queryFn: () =>
      enrollmentsApi.getAvailableSubjects().then((res) => res.data),
  });

  const { data: myEnrollments, isLoading: myEnrollmentsLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.getMy().then((res) => res.data),
  });

  const enrollMutation = useMutation({
    mutationFn: enrollmentsApi.enroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      showNotification('Uspešno ste se upisali na predmet', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri upisu',
        'error',
      );
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: enrollmentsApi.unenroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      showNotification('Uspešno ste se odpisali sa predmeta', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri odpisu',
        'error',
      );
    },
  });

  if (!hasRole(UserRole.STUDENT)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (availableLoading || myEnrollmentsLoading) {
    return <LoadingSpinner />;
  }

  const enrolledSubjectIds = new Set(
    myEnrollments?.map((e) => e.subjectId) || [],
  );

  const enrolledSubjects = availableSubjects?.filter((subject) =>
    enrolledSubjectIds.has(subject.id),
  );
  const notEnrolledSubjects = availableSubjects?.filter(
    (subject) => !enrolledSubjectIds.has(subject.id),
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Upis na predmete
      </h1>

      {/* Moji upisani predmeti */}
      {enrolledSubjects && enrolledSubjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Moji upisani predmeti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledSubjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-green-200 dark:border-green-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {subject.name}
                      </h3>
                      {subject.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <User className="w-4 h-4" />
                  <span>
                    {subject.teacher?.firstName} {subject.teacher?.lastName}
                  </span>
                </div>
                <button
                  onClick={() => unenrollMutation.mutate(subject.id)}
                  disabled={unenrollMutation.isPending}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Odpisi se</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Dostupni predmeti */}
      {notEnrolledSubjects && notEnrolledSubjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Dostupni predmeti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notEnrolledSubjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {subject.name}
                      </h3>
                      {subject.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <User className="w-4 h-4" />
                  <span>
                    {subject.teacher?.firstName} {subject.teacher?.lastName}
                  </span>
                </div>
                <button
                  onClick={() => enrollMutation.mutate(subject.id)}
                  disabled={enrollMutation.isPending}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upiši se</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {(!availableSubjects || availableSubjects.length === 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Nema dostupnih predmeta za upis
          </p>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
