import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { Users, BookOpen, Calendar, ClipboardList } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { hasRole } = useAuthContext();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statisticsApi.getDashboard().then((res) => res.data),
  });

  if (!hasRole(UserRole.ADMIN)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      title: 'Ukupno korisnika',
      value: data?.users?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Profesora',
      value: data?.users?.teachers || 0,
      icon: Users,
      color: 'bg-green-500',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Studenata',
      value: data?.users?.students || 0,
      icon: Users,
      color: 'bg-purple-500',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Predmeta',
      value: data?.subjects?.total || 0,
      icon: BookOpen,
      color: 'bg-yellow-500',
      onClick: () => navigate('/teacher/subjects'),
    },
    {
      title: 'Časova',
      value: data?.classes?.total || 0,
      icon: Calendar,
      color: 'bg-indigo-500',
      onClick: () => navigate('/teacher/classes'),
    },
    {
      title: 'Prisustava',
      value: data?.attendances?.total || 0,
      icon: ClipboardList,
      color: 'bg-red-500',
      onClick: () => navigate('/teacher/attendance'),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div
                className={`${stat.color} p-4 rounded-full text-white`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
