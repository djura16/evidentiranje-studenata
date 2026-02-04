import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi, subjectsApi } from '../../services/api';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import ClassModal from '../../components/Modals/ClassModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const ClassesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getAll().then((res) => res.data),
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', selectedSubjectId],
    queryFn: () => classesApi.getAll(selectedSubjectId).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: classesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      showNotification('Čas uspešno obrisan', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri brisanju',
        'error',
      );
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Časovi
        </h1>
        <div className="flex space-x-4">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="">Svi predmeti</option>
            {subjects?.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj čas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((classSession) => (
          <motion.div
            key={classSession.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {classSession.subject?.name || 'Nepoznat predmet'}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(new Date(classSession.startTime), 'dd.MM.yyyy HH:mm', {
                        locale: sr,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {classSession.isActive && (
                <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  Aktivan
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              <Link
                to={`/teacher/classes/${classSession.id}`}
                className="flex-1 text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Detalji
              </Link>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Da li ste sigurni da želite da obrišete ovaj čas?',
                    )
                  ) {
                    deleteMutation.mutate(classSession.id);
                  }
                }}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                Obriši
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <ClassModal
          onClose={() => setIsModalOpen(false)}
          subjects={subjects || []}
        />
      )}
    </div>
  );
};

export default ClassesPage;
