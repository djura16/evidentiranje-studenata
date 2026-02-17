import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen, User, CheckCircle } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate } from 'react-router-dom';

const EnrollmentsPage: React.FC = () => {
  const { hasRole } = useAuthContext();

  const { data: myEnrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.getMy().then((res) => res.data),
  });

  if (!hasRole(UserRole.STUDENT)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const subjects = myEnrollments?.map((e) => e.subject).filter(Boolean) || [];

  const formatTeachers = (subject: any) => {
    const teachers = subject?.subjectTeachers?.map((st: any) => st.teacher).filter(Boolean) || [];
    if (teachers.length > 0) {
      return teachers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ');
    }
    return subject?.teacher ? `${subject.teacher.firstName} ${subject.teacher.lastName}` : '—';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Moji upisani predmeti
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Pregled predmeta na koje ste upisani. Upis i ispis obavlja administrator.
      </p>

      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject: any, index: number) => (
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
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{formatTeachers(subject)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Niste upisani ni na jedan predmet. Administrator vas može upisati na predmete.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
