import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useRegister } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { UserRole } from '@evidentiranje/shared';

const registerSchema = Yup.object().shape({
  email: Yup.string()
    .email('Neispravan email format')
    .required('Email je obavezan'),
  password: Yup.string()
    .min(8, 'Lozinka mora imati najmanje 8 karaktera')
    .required('Lozinka je obavezna'),
  firstName: Yup.string().required('Ime je obavezno'),
  lastName: Yup.string().required('Prezime je obavezno'),
  role: Yup.string().oneOf(
    [UserRole.STUDENT, UserRole.TEACHER],
    'Neispravna uloga',
  ),
});

const RegisterPage: React.FC = () => {
  const registerMutation = useRegister();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Registracija
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kreirajte novi nalog
            </p>
          </div>

          <Formik
            initialValues={{
              email: '',
              password: '',
              firstName: '',
              lastName: '',
              role: UserRole.STUDENT,
            }}
            validationSchema={registerSchema}
            onSubmit={(values, { setSubmitting }) => {
              registerMutation.mutate(values, {
                onSuccess: () => {
                  navigate('/login');
                  setSubmitting(false);
                },
                onError: () => {
                  setSubmitting(false);
                },
              });
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ime
                    </label>
                    <Field
                      type="text"
                      name="firstName"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lozinka
                  </label>
                  <Field
                    type="password"
                    name="password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="password"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.TEACHER}>Profesor</option>
                  </Field>
                  <ErrorMessage
                    name="role"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Registracija...' : 'Registruj se'}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Već imate nalog?{' '}
              <a
                href="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Prijavite se
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
