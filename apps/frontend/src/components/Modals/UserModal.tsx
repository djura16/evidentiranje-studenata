import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, User } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { UserRole } from '@evidentiranje/shared';
import { X } from 'lucide-react';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
}

const userSchema = Yup.object().shape({
  email: Yup.string()
    .email('Neispravan email format')
    .required('Email je obavezan'),
  firstName: Yup.string().required('Ime je obavezno'),
  lastName: Yup.string().required('Prezime je obavezno'),
  indexNumber: Yup.string().test(
    'indexFormat',
    'Samo cifre (npr. 001)',
    (v) => !v || /^\d+$/.test(v),
  ),
  enrollmentYear: Yup.number()
    .nullable()
    .min(2000, 'Godina 2000-2050')
    .max(2050, 'Godina 2000-2050'),
  role: Yup.string()
    .oneOf([UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT])
    .required('Uloga je obavezna'),
  password: Yup.string().when('user', {
    is: null,
    then: (schema) => schema.min(8, 'Lozinka mora imati najmanje 8 karaktera').required('Lozinka je obavezna'),
    otherwise: (schema) => schema.min(8, 'Lozinka mora imati najmanje 8 karaktera'),
  }),
});

const UserModal: React.FC<UserModalProps> = ({ user, onClose }) => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification('Korisnik uspešno kreiran', 'success');
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
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification('Korisnik uspešno ažuriran', 'success');
      onClose();
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri ažuriranju',
        'error',
      );
    },
  });

  const isEditing = !!user;

  const getAcademicYearOptions = () => {
    const startYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const y = startYear - i;
      return y;
    });
  };

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
              {isEditing ? 'Izmeni korisnika' : 'Dodaj korisnika'}
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
              email: user?.email || '',
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              indexNumber: (() => {
                const inum = (user as any)?.indexNumber;
                if (!inum) return '';
                if (inum.includes('/')) return inum.split('/')[0];
                return inum;
              })(),
              enrollmentYear: (() => {
                const u = user as any;
                if (u?.enrollmentYear) return u.enrollmentYear;
                const inum = u?.indexNumber;
                if (inum?.includes('/')) {
                  const y = parseInt(inum.split('/')[1], 10);
                  return isNaN(y) ? '' : y;
                }
                return '';
              })(),
              role: user?.role || UserRole.STUDENT,
              password: '',
            }}
            validationSchema={userSchema}
            onSubmit={(values, { setSubmitting }) => {
              const { password, ...rest } = values;
              const data: any = password ? { ...values } : { ...rest };
              if (data.enrollmentYear === '' || data.enrollmentYear == null) {
                delete data.enrollmentYear;
              } else {
                data.enrollmentYear = Number(data.enrollmentYear);
              }
              if (!data.indexNumber && data.role !== UserRole.STUDENT) {
                delete data.indexNumber;
              }

              if (isEditing) {
                updateMutation.mutate({ id: user.id, data });
              } else {
                createMutation.mutate(data);
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ime
                    </label>
                    <Field
                      type="text"
                      name="firstName"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <ErrorMessage
                      name="firstName"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prezime
                    </label>
                    <Field
                      type="text"
                      name="lastName"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <ErrorMessage
                      name="lastName"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uloga
                  </label>
                  <Field
                    as="select"
                    name="role"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.TEACHER}>Profesor</option>
                    <option value={UserRole.STUDENT}>Student</option>
                  </Field>
                  <ErrorMessage
                    name="role"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {values.role === UserRole.STUDENT && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Broj indeksa
                      </label>
                      <Field
                        type="text"
                        name="indexNumber"
                        placeholder="npr. 001"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <ErrorMessage
                        name="indexNumber"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Godina upisa
                      </label>
                      <Field
                        as="select"
                        name="enrollmentYear"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">—</option>
                        {getAcademicYearOptions().map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name="enrollmentYear"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lozinka {isEditing && '(ostavite prazno da ne menjate)'}
                  </label>
                  <Field
                    type="password"
                    name="password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="password"
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

export default UserModal;
