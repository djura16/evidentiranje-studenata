import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { Calendar, ClipboardList, TrendingUp } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
  const { hasRole } = useAuthContext();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statisticsApi.getDashboard().then((res) => res.data),
  });

  if (!hasRole(UserRole.STUDENT)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const quickActions = [
    {
      title: 'Skeniraj QR kod',
      description: 'Evidentiraj prisustvo',
      icon: ClipboardList,
      link: '/student/scan',
      color: 'bg-blue-500',
    },
    {
      title: 'Kalendar časova',
      description: 'Pregled svih časova',
      icon: Calendar,
      link: '/student/calendar',
      color: 'bg-green-500',
    },
    {
      title: 'Moje prisustvo',
      description: 'Statistika prisustva',
      icon: TrendingUp,
      link: '/student/attendance',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Student Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                Ukupno časova
              </p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {data?.classes?.total || 0}
              </p>
            </div>
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                Prisustva
              </p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {data?.attendances?.total || 0}
              </p>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                Procenat prisustva
              </p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {data?.attendances?.percentage || 0}%
              </p>
            </div>
            <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Link key={action.title} to={action.link}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className={`${action.color} p-4 rounded-lg w-fit mb-4`}>
                <action.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {action.description}
              </p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
