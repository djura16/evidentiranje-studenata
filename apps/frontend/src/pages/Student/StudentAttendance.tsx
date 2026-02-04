import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../services/api';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentAttendance: React.FC = () => {
  const { data: attendances, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => attendanceApi.getMy().then((res) => res.data),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Moje prisustvo
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Ukupno prisustva: {attendances?.length || 0}
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {attendances && attendances.length > 0 ? (
          attendances.map((attendance) => (
            <motion.div
              key={attendance.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      {attendance.classSession?.subject?.name || 'Nepoznat predmet'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(attendance.timestamp), 'dd.MM.yyyy HH:mm', {
                        locale: sr,
                      })}
                    </p>
                    {attendance.classSession && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Čas: {format(new Date(attendance.classSession.startTime), 'dd.MM.yyyy HH:mm', {
                          locale: sr,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Nemate evidentiranih prisustava
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
