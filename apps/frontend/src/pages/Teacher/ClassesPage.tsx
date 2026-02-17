import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi, subjectsApi, ClassSession } from '../../services/api';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, Lock, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { sr } from 'date-fns/locale';
import ClassModal from '../../components/Modals/ClassModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

type TabType = 'current' | 'completed';

const ClassesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('current');
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
    queryFn: () =>
        classesApi
          .getAll({ subjectId: selectedSubjectId || undefined })
          .then((res) => res.data),
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

  const { currentClasses, completedClasses } = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    const activationWindowStart = (start: Date) => {
      const s = new Date(start);
      s.setMinutes(s.getMinutes() - 15);
      return s;
    };

    const current: Array<{ session: ClassSession; canEnter: boolean }> = [];
    const completed: ClassSession[] = [];

    classes?.forEach((session) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);

      if (isBefore(end, now)) {
        completed.push(session);
        return;
      }

      if (isAfter(start, weekEnd)) return;

      const windowStart = activationWindowStart(start);
      const canEnter =
        session.isActive || !isBefore(now, windowStart);

      current.push({ session, canEnter });
    });

    current.sort(
      (a, b) =>
        new Date(a.session.startTime).getTime() -
        new Date(b.session.startTime).getTime(),
    );
    completed.sort(
      (a, b) =>
        new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
    );

    return { currentClasses: current, completedClasses: completed };
  }, [classes]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Časovi
        </h1>
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'current'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Trenutni časovi
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Završeni časovi
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'current' &&
          currentClasses.map(({ session, canEnter }) => (
            <ClassCard
              key={session.id}
              session={session}
              canEnter={canEnter}
              isCompleted={false}
              onDelete={() => {
                if (window.confirm('Da li ste sigurni da želite da obrišete ovaj čas?')) {
                  deleteMutation.mutate(session.id);
                }
              }}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        {activeTab === 'completed' &&
          completedClasses.map((session) => (
            <ClassCard
              key={session.id}
              session={session}
              canEnter={true}
              isCompleted={true}
              onDelete={() => {
                if (window.confirm('Da li ste sigurni da želite da obrišete ovaj čas?')) {
                  deleteMutation.mutate(session.id);
                }
              }}
              isDeleting={deleteMutation.isPending}
            />
          ))}
      </div>

      {activeTab === 'current' && currentClasses.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Nema trenutnih ili predstojećih časova u narednih 7 dana.
          </p>
        </div>
      )}

      {activeTab === 'completed' && completedClasses.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <CheckCircle className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Nema završenih časova.
          </p>
        </div>
      )}

      {isModalOpen && (
        <ClassModal
          onClose={() => setIsModalOpen(false)}
          subjects={subjects || []}
        />
      )}
    </div>
  );
};

interface ClassCardProps {
  session: ClassSession;
  canEnter: boolean;
  isCompleted: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({
  session,
  canEnter,
  isCompleted,
  onDelete,
  isDeleting,
}) => {
  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-lg ${
              canEnter && !isCompleted
                ? 'bg-indigo-100 dark:bg-indigo-900'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <Calendar
              className={`w-6 h-6 ${
                canEnter && !isCompleted
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {session.subject?.name || 'Nepoznat predmet'}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Clock className="w-4 h-4" />
              <span>
                {format(new Date(session.startTime), 'dd.MM.yyyy HH:mm', {
                  locale: sr,
                })}{' '}
                –{' '}
                {format(new Date(session.endTime), 'HH:mm', { locale: sr })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {session.isActive && (
            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
              Aktivan
            </span>
          )}
          {!canEnter && !isCompleted && (
            <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Zaključan
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        {canEnter ? (
          <Link
            to={`/teacher/classes/${session.id}`}
            className="flex-1 text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            Detalji
          </Link>
        ) : (
          <div
            className="flex-1 text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
            title="Možete ući najranije 15 minuta pre početka časa"
          >
            Detalji (zaključan)
          </div>
        )}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
        >
          Obriši
        </button>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg shadow-lg p-6 transition-all ${
        canEnter
          ? 'bg-white dark:bg-gray-800 hover:shadow-xl'
          : 'bg-gray-50 dark:bg-gray-800/70 opacity-90'
      }`}
    >
      {cardContent}
    </motion.div>
  );
};

export default ClassesPage;
