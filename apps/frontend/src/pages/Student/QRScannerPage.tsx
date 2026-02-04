import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { attendanceApi } from '../../services/api';
import { motion } from 'framer-motion';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const QRScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [scanned, setScanned] = useState(false);
  const { showNotification } = useNotification();

  const scanMutation = useMutation({
    mutationFn: attendanceApi.scan,
    onSuccess: () => {
      setScanned(true);
      showNotification('Prisustvo uspešno evidentirano!', 'success');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri skeniranju',
        'error',
      );
    },
  });

  useEffect(() => {
    if (token && !scanned) {
      scanMutation.mutate(token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Neispravan QR kod
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            QR kod nije validan ili je istekao
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nazad na dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (scanned) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Uspešno!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vaše prisustvo je evidentirano
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-4"
        >
          <QrCode className="w-16 h-16 text-blue-500 mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Skeniranje QR koda...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Molimo sačekajte
        </p>
      </motion.div>
    </div>
  );
};

export default QRScannerPage;
