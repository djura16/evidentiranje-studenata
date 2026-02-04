import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi, Subject } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { X } from 'lucide-react';

interface SubjectModalProps {
  subject: Subject | null;
  onClose: () => void;
}

const subjectSchema = Yup.object().shape({
  name: Yup.string().required('Naziv predmeta je obavezan'),
  description: Yup.string(),
});

const SubjectModal: React.FC<SubjectModalProps> = ({ subject, onClose }) => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      showNotification('Predmet uspešno kreiran', 'success');
      onClose();
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri kreiranju',
        'error',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      showNotification('Predmet uspešno ažuriran', 'success');
      onClose();
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri ažuriranju',
        'error',
      );
    },
  });

  const isEditing = !!subject;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isEditing ? 'Izmeni predmet' : 'Dodaj predmet'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <Formik
            initialValues={{
              name: subject?.name || '',
              description: subject?.description || '',
            }}
            validationSchema={subjectSchema}
            onSubmit={(values, { setSubmitting }) => {
              if (isEditing) {
                updateMutation.mutate({ id: subject.id, data: values });
              } else {
                createMutation.mutate(values);
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Naziv predmeta
                  </label>
                  <Field
                    type="text"
                    name="name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opis
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? 'Sačuvaj...'
                      : isEditing
                        ? 'Sačuvaj izmene'
                        : 'Kreiraj'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubjectModal;
