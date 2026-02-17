import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classesApi } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

const QrDisplayFullscreenPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const { data: classSession, isLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesApi.getById(id!).then((res) => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (!classSession?.expiresAt || !classSession?.isActive) {
      if (
        classSession?.expiresAt &&
        new Date() > new Date(classSession.expiresAt)
      ) {
        setIsExpired(true);
      }
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(classSession.expiresAt ?? 0).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [classSession?.expiresAt, classSession?.isActive]);

  const qrCodeUrl =
    classSession?.qrCodeUrl ||
    (classSession?.qrCodeToken
      ? `${import.meta.env.VITE_QR_BASE_URL || `${window.location.origin}/attend?token=`}${classSession.qrCodeToken}`
      : null);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!classSession || !qrCodeUrl) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <p className="text-xl text-white">
          QR kod nije dostupan
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
      {isExpired ? (
        <p className="text-4xl font-bold text-white text-center px-8">
          Vreme prijave je isteklo
        </p>
      ) : (
        <>
          <div className="p-8 bg-white rounded-2xl shadow-2xl mb-8">
            <QRCodeSVG value={qrCodeUrl} size={400} />
          </div>
          {timeRemaining !== null && (
            <div className="text-center">
              <p className="text-lg text-gray-400 mb-2">Preostalo vreme</p>
              <p
                className={`text-6xl font-bold font-mono ${
                  timeRemaining < 60 ? 'text-red-500' : 'text-white'
                }`}
              >
                {Math.floor(timeRemaining / 60)}:
                {String(timeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QrDisplayFullscreenPage;
