import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subjectsApi,
  enrollmentsApi,
  usersApi,
  Subject,
  User,
  Enrollment,
} from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import AdminSubjectModal from '../../components/Modals/AdminSubjectModal';

const AdminSubjectsPage: React.FC = () => {
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () =>
      subjectsApi.getAll().then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: subjectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      showNotification('Predmet uspešno obrisan', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri brisanju',
        'error',
      );
    },
  });

  const teachers = users?.filter((u) => u.role === UserRole.TEACHER) || [];
  const students = users?.filter((u) => u.role === UserRole.STUDENT) || [];

  const handleDelete = (id: string) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovaj predmet?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  if (subjectsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Upravljanje predmetima
        </h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj predmet</span>
        </button>
      </div>

      <div className="space-y-2">
        {subjects?.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            students={students}
            isExpanded={expandedSubjectId === subject.id}
            onToggleExpand={() =>
              setExpandedSubjectId(
                expandedSubjectId === subject.id ? null : subject.id,
              )
            }
            onEdit={() => handleEdit(subject)}
            onDelete={() => handleDelete(subject.id)}
            queryClient={queryClient}
            showNotification={showNotification}
          />
        ))}
      </div>

      {(!subjects || subjects.length === 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nema predmeta. Dodajte prvi predmet.
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj predmet</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <AdminSubjectModal
            subject={editingSubject}
            teachers={teachers}
            onClose={() => {
              setIsModalOpen(false);
              setEditingSubject(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface SubjectCardProps {
  subject: Subject;
  students: User[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  queryClient: any;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  students,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  queryClient,
  showNotification,
}) => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', subject.id],
    queryFn: () => enrollmentsApi.getBySubject(subject.id).then((res) => res.data),
    enabled: isExpanded,
  });

  const [addStudentId, setAddStudentId] = useState('');
  const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());

  const enrollMutation = useMutation({
    mutationFn: () =>
      enrollmentsApi.adminEnroll(subject.id, addStudentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', subject.id] });
      showNotification('Student uspešno upisan', 'success');
      setAddStudentId('');
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.message || 'Greška', 'error');
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (studentId: string) =>
      enrollmentsApi.adminUnenroll(subject.id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', subject.id] });
      showNotification('Student uspešno ispisan', 'success');
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.message || 'Greška', 'error');
    },
  });

  const bulkEnrollMutation = useMutation({
    mutationFn: () =>
      enrollmentsApi.bulkEnrollByYear(subject.id, bulkYear),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', subject.id] });
      showNotification(`Upisano ${data.data?.enrolled ?? 0} studenata`, 'success');
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.message || 'Greška', 'error');
    },
  });

  const bulkUnenrollMutation = useMutation({
    mutationFn: () =>
      enrollmentsApi.bulkUnenrollByYear(subject.id, bulkYear),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', subject.id] });
      const count = res?.data?.unenrolled ?? res?.data?.data?.unenrolled ?? 0;
      showNotification(`Ispisano ${count} studenata`, 'success');
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.message || 'Greška', 'error');
    },
  });

  const formatIndex = (u?: User) => {
    if (!u) return '—';
    const num = u.indexNumber ?? '';
    const year = (u as any).enrollmentYear;
    return year ? `${num}/${year}` : num || '—';
  };

  const teacherNames =
    (subject.subjectTeachers?.length ?? 0) > 0
      ? (subject.subjectTeachers ?? [])
          .map((st) => st.teacher)
          .filter(Boolean)
          .map((t: any) => `${t.firstName} ${t.lastName}`)
          .join(', ')
      : subject.teacher
        ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
        : '—';

  const enrolledIds = new Set(enrollments?.map((e) => e.studentId) || []);
  const availableStudents = students.filter((s) => !enrolledIds.has(s.id));

  const getAcademicYearOptions = () => {
    const startYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const y = startYear - i;
      return y;
    });
  };
  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {subject.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {teacherNames}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            Izmeni
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Obriši
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
              <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Upisani studenti
              </h4>

              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Dodaj studenta
                  </label>
                  <select
                    value={addStudentId}
                    onChange={(e) => setAddStudentId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white min-w-[200px]"
                  >
                    <option value="">Izaberi studenta...</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({formatIndex(s)})
                      </option>
                    ))}
                    {availableStudents.length === 0 && (
                      <option disabled>Svi studenti su već upisani</option>
                    )}
                  </select>
                </div>
                <button
                  onClick={() => addStudentId && enrollMutation.mutate()}
                  disabled={!addStudentId || enrollMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  Dodaj
                </button>
              </div>

              <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Masovno po godini upisa
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={bulkYear}
                      onChange={(e) => setBulkYear(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      {getAcademicYearOptions().map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => bulkEnrollMutation.mutate()}
                      disabled={bulkEnrollMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Upisi sve
                    </button>
                    <button
                      onClick={() => bulkUnenrollMutation.mutate()}
                      disabled={bulkUnenrollMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Ispiši sve
                    </button>
                  </div>
                </div>
              </div>

              {enrollmentsLoading ? (
                <p className="text-gray-500">Učitavanje...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400">
                        <th className="py-2">Ime</th>
                        <th className="py-2">Indeks</th>
                        <th className="py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments?.map((e: Enrollment) => (
                        <tr
                          key={e.id}
                          className="border-t border-gray-200 dark:border-gray-600"
                        >
                          <td className="py-2">
                            {e.student?.firstName} {e.student?.lastName}
                          </td>
                          <td className="py-2">{formatIndex(e.student)}</td>
                          <td className="py-2">
                            <button
                              onClick={() => unenrollMutation.mutate(e.studentId)}
                              disabled={unenrollMutation.isPending}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              Ispiši
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!enrollments || enrollments.length === 0) && (
                        <tr>
                          <td colSpan={3} className="py-4 text-gray-500 text-center">
                            Nema upisanih studenata
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminSubjectsPage;
