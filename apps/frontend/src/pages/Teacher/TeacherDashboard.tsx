import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, ClipboardList } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate, useNavigate } from 'react-router-dom';

const TeacherDashboard: React.FC = () => {
  const { hasRole } = useAuthContext();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statisticsApi.getDashboard().then((res) => res.data),
  });

  if (!hasRole(UserRole.TEACHER)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      title: 'Moji predmeti',
      value: data?.subjects?.total || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      onClick: () => navigate('/teacher/subjects'),
    },
    {
      title: 'Ukupno časova',
      value: data?.classes?.total || 0,
      icon: Calendar,
      color: 'bg-green-500',
      onClick: () => navigate('/teacher/classes'),
    },
    {
      title: 'Prisustva',
      value: data?.attendances?.total || 0,
      icon: ClipboardList,
      color: 'bg-purple-500',
      onClick: () => navigate('/teacher/attendance'),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Profesor Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-4 rounded-full text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {data?.subjects?.list && data.subjects.list.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Moji predmeti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.subjects.list.map((subject) => (
              <div
                key={subject.id}
                onClick={() => navigate(`/teacher/subjects`)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-medium text-gray-800 dark:text-white">
                  {subject.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
