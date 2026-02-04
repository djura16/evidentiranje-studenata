import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi, Subject } from '../../services/api';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import SubjectModal from '../../components/Modals/SubjectModal';
import LoadingSpinner from '../../components/LoadingSpinner';

const SubjectsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: subjectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      showNotification('Predmet uspešno obrisan', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri brisanju',
        'error',
      );
    },
  });

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovaj predmet?')) {
      deleteMutation.mutate(id);
    }
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
        <button
          onClick={() => {
            setEditingSubject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj predmet</span>
        </button>
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
                  {subject.teacher && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {subject.teacher.firstName} {subject.teacher.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {subject.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {subject.description}
              </p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(subject)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Izmeni</span>
              </button>
              <button
                onClick={() => handleDelete(subject.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Obriši</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <SubjectModal
          subject={editingSubject}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSubject(null);
          }}
        />
      )}
    </div>
  );
};

export default SubjectsPage;
