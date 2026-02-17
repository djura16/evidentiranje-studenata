import { useQuery } from '@tanstack/react-query';
import {
  classesApi,
  attendanceApi,
  enrollmentsApi,
  subjectsApi,
} from '../../services/api';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserRole } from '@evidentiranje/shared';
import { Navigate, useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { sr } from 'date-fns/locale';
import { useState } from 'react';

const PAGE_SIZE = 20;

const AttendancePage: React.FC = () => {
  const [exportingId, setExportingId] = useState<string | null>(null);
  const { hasRole } = useAuthContext();
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  const { data: subjects } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: () => subjectsApi.getAll().then((res) => res.data),
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: [
      'teacher-classes-held',
      subjectFilter || undefined,
      page,
    ],
    queryFn: () =>
      classesApi
        .getAll({
          subjectId: subjectFilter || undefined,
          heldOnly: true,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        })
        .then((res) => res.data),
  });

  const { data: totalCount } = useQuery({
    queryKey: ['teacher-classes-held-count', subjectFilter || undefined],
    queryFn: () =>
      classesApi.countHeld(subjectFilter || undefined),
  });

  const totalCountNum = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCountNum / PAGE_SIZE));
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances', selectedClassId],
    queryFn: () =>
      attendanceApi.getByClass(selectedClassId!).then((res) => res.data),
    enabled: !!selectedClassId,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', selectedClassId],
    queryFn: () => {
      if (!selectedClassId || !classes) return [];
      const classSession = classes.find((c) => c.id === selectedClassId);
      if (!classSession?.subjectId) return [];
      return enrollmentsApi
        .getBySubject(classSession.subjectId)
        .then((res) => res.data);
    },
    enabled: !!selectedClassId && !!classes,
  });

  if (!hasRole(UserRole.TEACHER)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (classesLoading && !classes) {
    return <LoadingSpinner />;
  }

  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  const handleExportExcel = async () => {
    if (!selectedClassId || !attendances || !selectedClass) return;
    setExportingId(selectedClassId);
    try {
      const rows = attendances.map((a, i) => ({
        'Rb.': i + 1,
        Ime: a.student?.firstName ?? '',
        Prezime: a.student?.lastName ?? '',
        'Broj indeksa': a.student?.indexNumber ?? '',
        Email: a.student?.email ?? '',
        'Vreme prijave': format(new Date(a.timestamp), 'dd.MM.yyyy HH:mm:ss', {
          locale: sr,
        }),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Evidentirani');
      const subjectName = selectedClass.subject?.name ?? 'Prisustvo';
      const classTime = `${format(new Date(selectedClass.startTime), 'dd.MM.yyyy', { locale: sr })}_${format(new Date(selectedClass.startTime), 'HH-mm', { locale: sr })}`;
      const safeName = `${subjectName.replace(/[^\w\s-]/g, '')}_${classTime}`;
      XLSX.writeFile(wb, `evidencija_${safeName}.xlsx`);
    } finally {
      setExportingId(null);
    }
  };

  const teacherSubjects = subjects ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Prisustva po času
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista časova */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Održani časovi
            </h2>

            {/* Filter po predmetu */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Predmet
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setPage(0);
                  setSelectedClassId(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Svi predmeti</option>
                {teacherSubjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Paginacija */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Strana {page + 1} / {totalPages} ({totalCountNum} časova)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1));
                      setSelectedClassId(null);
                    }}
                    disabled={!hasPrevPage}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setPage((p) => Math.min(totalPages - 1, p + 1));
                      setSelectedClassId(null);
                    }}
                    disabled={!hasNextPage}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {classes && classes.length > 0 ? (
                classes.map((classSession) => {
                  const isTodayClass = isToday(new Date(classSession.startTime));
                  return (
                    <div
                      key={classSession.id}
                      onClick={() => setSelectedClassId(classSession.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedClassId === classSession.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isTodayClass
                            ? 'border-green-400 dark:border-green-600 bg-green-100 dark:bg-green-900/50 hover:border-green-500 dark:hover:border-green-500'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-800 dark:text-white">
                          {classSession.subject?.name || 'Nepoznat predmet'}
                        </h3>
                        <div className="flex gap-1">
                          {classSession.isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 rounded">
                              Aktivan
                            </span>
                          )}
                          {isTodayClass && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100 rounded">
                              Danas
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(classSession.startTime), 'dd.MM.yyyy', {
                              locale: sr,
                            })}
                          </span>
                        </div>
                        <div className="mt-1">
                          {format(new Date(classSession.startTime), 'HH:mm', {
                            locale: sr,
                          })}{' '}
                          -{' '}
                          {format(new Date(classSession.endTime), 'HH:mm', {
                            locale: sr,
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {subjectFilter
                    ? 'Nema održanih časova za ovaj predmet'
                    : 'Nema održanih časova'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Detalji prisustva */}
        <div className="lg:col-span-2">
          {selectedClassId ? (
            <div className="space-y-6">
              {attendancesLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {selectedClass?.subject?.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportExcel}
                          disabled={
                            !attendances?.length || exportingId === selectedClassId
                          }
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          {exportingId === selectedClassId
                            ? 'Preuzimanje...'
                            : 'Preuzmi Excel'}
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/teacher/classes/${selectedClassId}`)
                          }
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Detalji časa →
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {selectedClass &&
                        format(
                          new Date(selectedClass.startTime),
                          'dd.MM.yyyy HH:mm',
                          { locale: sr },
                        )}{' '}
                      -{' '}
                      {selectedClass &&
                        format(new Date(selectedClass.endTime), 'HH:mm', {
                          locale: sr,
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            Prisutni
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {attendances?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            Upisani
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                          {enrollments?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                        Lista prisustva
                      </h3>
                      <div className="space-y-2">
                        {attendances && attendances.length > 0 ? (
                          attendances.map((attendance) => (
                            <div
                              key={attendance.id}
                              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {attendance.student?.firstName}{' '}
                                  {attendance.student?.lastName}
                                  {attendance.student?.indexNumber && (
                                    <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                                      ({attendance.student.indexNumber})
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {format(
                                    new Date(attendance.timestamp),
                                    'dd.MM.yyyy HH:mm:ss',
                                    { locale: sr },
                                  )}
                                </p>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Nema evidentiranih prisustava
                          </p>
                        )}
                      </div>
                    </div>

                    {enrollments && enrollments.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                          Upisani studenti koji nisu prisustvovali
                        </h3>
                        <div className="space-y-2">
                          {enrollments
                            .filter(
                              (enrollment) =>
                                !attendances?.some(
                                  (attendance) =>
                                    attendance.studentId === enrollment.studentId,
                                ),
                            )
                            .map((enrollment) => (
                              <div
                                key={enrollment.id}
                                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">
                                    {enrollment.student?.firstName}{' '}
                                    {enrollment.student?.lastName}
                                    {enrollment.student?.indexNumber && (
                                      <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                                        ({enrollment.student.indexNumber})
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {enrollment.student?.email}
                                  </p>
                                </div>
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Izaberite čas da vidite prisustva
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
