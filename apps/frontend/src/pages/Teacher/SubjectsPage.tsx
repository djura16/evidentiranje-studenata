import { useQuery } from '@tanstack/react-query';
import { subjectsApi, Subject } from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const SubjectsPage: React.FC = () => {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getAll().then((res) => res.data),
  });

  const formatTeachers = (s: Subject) => {
    if (s.subjectTeachers?.length) {
      return s.subjectTeachers.map((st) => st.teacher).filter(Boolean).map((t: any) => `${t.firstName} ${t.lastName}`).join(', ');
    }
    return s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : '—';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Predmeti
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects?.map((subject) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTeachers(subject)}
                  </p>
                </div>
              </div>
            </div>

            {subject.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {subject.description}
              </p>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Predmeti na koje ste dodeljeni. Kreiranje i izmena predmeta obavlja administrator.
            </p>
          </motion.div>
        ))}
      </div>

    </div>
  );
};

export default SubjectsPage;
