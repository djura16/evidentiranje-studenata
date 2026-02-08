import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { classesApi, attendanceApi, enrollmentsApi } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Play, Square, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useState, useEffect } from 'react';

const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [expirationMinutes, setExpirationMinutes] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const { data: classSession, isLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesApi.getById(id!).then((res) => res.data),
    enabled: !!id,
  });

  const { data: attendances } = useQuery({
    queryKey: ['attendances', id],
    queryFn: () => attendanceApi.getByClass(id!).then((res) => res.data),
    enabled: !!id && !!classSession,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', classSession?.subjectId],
    queryFn: () =>
      enrollmentsApi
        .getBySubject(classSession!.subjectId)
        .then((res) => res.data),
    enabled: !!classSession?.subjectId,
  });

  const activateMutation = useMutation({
    mutationFn: (expMinutes: number) => classesApi.activate(id!, expMinutes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['class', id] });
      queryClient.setQueryData(['class', id], data.data);
      showNotification('Čas aktiviran, QR kod generisan', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri aktivaciji',
        'error',
      );
    },
  });

  // Timer za odbrojavanje
  useEffect(() => {
    if (!classSession?.expiresAt || !classSession.isActive) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(classSession.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remaining);

      // Automatski osveži podatke kada istekne
      if (remaining === 0) {
        queryClient.invalidateQueries({ queryKey: ['class', id] });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [classSession?.expiresAt, classSession?.isActive, queryClient, id]);

  const deactivateMutation = useMutation({
    mutationFn: classesApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', id] });
      showNotification('Čas deaktiviran', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri deaktivaciji',
        'error',
      );
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!classSession) {
    return <div>Čas nije pronađen</div>;
  }

  const qrCodeUrl = classSession.qrCodeUrl || 
    (classSession.qrCodeToken 
      ? `${import.meta.env.VITE_QR_BASE_URL || 'http://localhost:3000/attend?token='}${classSession.qrCodeToken}`
      : null);

  return (
    <div>
      <button
        onClick={() => navigate('/teacher/classes')}
        className="mb-6 text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Nazad na časove
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {classSession.subject?.name}
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-5 h-5" />
              <span>
                {format(new Date(classSession.startTime), 'dd.MM.yyyy HH:mm', {
                  locale: sr,
                })}{' '}
                -{' '}
                {format(new Date(classSession.endTime), 'HH:mm', {
                  locale: sr,
                })}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  classSession.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {classSession.isActive ? 'Aktivan' : 'Neaktivan'}
              </span>
            </div>
          </div>

          {!classSession.isActive ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trajanje QR koda (minuti)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={expirationMinutes}
                  onChange={(e) => setExpirationMinutes(parseInt(e.target.value) || 5)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Unesite koliko minuta želite da QR kod bude aktivan (1-60)
                </p>
              </div>
              <button
                onClick={() => activateMutation.mutate(expirationMinutes)}
                disabled={activateMutation.isPending}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                <span>Aktiviraj čas</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => deactivateMutation.mutate(classSession.id)}
              disabled={deactivateMutation.isPending}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Square className="w-5 h-5" />
              <span>Deaktiviraj čas</span>
            </button>
          )}
        </div>

        {classSession.isActive && qrCodeUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              QR Kod za prisustvo
            </h3>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={qrCodeUrl} size={256} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Studenti mogu skenirati ovaj kod da evidentiraju prisustvo
              </p>
              {timeRemaining !== null && (
                <div className="w-full">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Preostalo vreme:
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        timeRemaining < 60
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {Math.floor(timeRemaining / 60)}:
                      {String(timeRemaining % 60).padStart(2, '0')}
                    </p>
                    {timeRemaining === 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        QR kod je istekao!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Prisutni studenti ({attendances?.length || 0}
              {enrollments && ` / ${enrollments.length} upisanih`})
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {attendances && attendances.length > 0 ? (
            attendances.map((attendance) => (
              <div
                key={attendance.id}
                className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {attendance.student?.firstName}{' '}
                    {attendance.student?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(attendance.timestamp), 'dd.MM.yyyy HH:mm', {
                      locale: sr,
                    })}
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

        {enrollments && enrollments.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Upisani studenti koji nisu prisustvovali (
              {enrollments.length - (attendances?.length || 0)})
            </h4>
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
                    className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {enrollment.student?.firstName}{' '}
                        {enrollment.student?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
    </div>
  );
};

export default ClassDetailPage;
