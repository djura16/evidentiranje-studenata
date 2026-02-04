import { useQuery } from '@tanstack/react-query';
import { subjectsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentSubjects: React.FC = () => {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getAll().then((res) => res.data),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Predmeti
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects?.map((subject) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start space-x-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {subject.name}
                </h3>
                {subject.teacher && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subject.teacher.firstName} {subject.teacher.lastName}
                  </p>
                )}
              </div>
            </div>

            {subject.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {subject.description}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StudentSubjects;
