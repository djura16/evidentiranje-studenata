import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi, Subject, User } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface AdminSubjectModalProps {
  subject: Subject | null;
  teachers: User[];
  onClose: () => void;
}

const DAY_NAMES = [
  { value: 1, label: 'Ponedeljak' },
  { value: 2, label: 'Utorak' },
  { value: 3, label: 'Sreda' },
  { value: 4, label: 'Četvrtak' },
  { value: 5, label: 'Petak' },
  { value: 6, label: 'Subota' },
  { value: 7, label: 'Nedelja' },
];

const SEMESTER_OPTIONS = [
  { value: 'winter', label: 'Zimski (oktobar – januar)' },
  { value: 'summer', label: 'Letnji (februar – jun)' },
];

const getCurrentAcademicYearStart = () => {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return m >= 9 ? y : y - 1;
};

const getAcademicYearOptions = () => {
  const startYear = getCurrentAcademicYearStart();
  return Array.from({ length: 6 }, (_, i) => {
    const y = startYear - 2 + i;
    return { value: y, label: `${y}/${y + 1}` };
  });
};

const subjectSchema = Yup.object().shape({
  name: Yup.string().required('Naziv predmeta je obavezan'),
  description: Yup.string(),
  teacherIds: Yup.array()
    .of(Yup.string().required())
    .min(1, 'Bar jedan profesor mora biti dodeljen'),
  semesterType: Yup.string(),
  academicYearStart: Yup.number(),
  schedules: Yup.array().of(
    Yup.object().shape({
      dayOfWeek: Yup.number().required(),
      startTime: Yup.string().required('Vreme je obavezno'),
      durationMinutes: Yup.number().min(15).max(240).required(),
      repeatsWeekly: Yup.boolean(),
    }),
  ),
});

const AdminSubjectModal: React.FC<AdminSubjectModalProps> = ({
  subject,
  teachers,
  onClose,
}) => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
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

  const initialTeacherIds = subject
    ? ((subject.subjectTeachers?.length ?? 0) > 0
        ? (subject.subjectTeachers ?? []).map((st) => st.teacherId)
        : subject.teacherId
          ? [subject.teacherId]
          : [])
    : [];

  const initialSchedules =
    subject?.schedules && subject.schedules.length > 0
      ? subject.schedules.map((s: any) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime || '14:00',
          durationMinutes: s.durationMinutes || 90,
          repeatsWeekly: s.repeatsWeekly ?? true,
        }))
      : [{ dayOfWeek: 1, startTime: '14:00', durationMinutes: 90, repeatsWeekly: true }];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 z-10 my-8 max-h-[90vh] overflow-y-auto"
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
              teacherIds: initialTeacherIds,
              semesterType: (subject as any)?.semesterType || 'winter',
              academicYearStart:
                (subject as any)?.academicYearStart ?? getCurrentAcademicYearStart(),
              schedules: initialSchedules,
            }}
            validationSchema={subjectSchema}
            onSubmit={(values, { setSubmitting, setFieldError }) => {
              if (
                !isEditing &&
                values.schedules &&
                values.schedules.length > 0 &&
                (!values.semesterType || !values.academicYearStart)
              ) {
                if (!values.semesterType) setFieldError('semesterType', 'Obavezno');
                if (!values.academicYearStart)
                  setFieldError('academicYearStart', 'Obavezno');
                setSubmitting(false);
                return;
              }
              if (!values.teacherIds?.length) {
                setFieldError('teacherIds', 'Bar jedan profesor mora biti dodeljen');
                setSubmitting(false);
                return;
              }
              const payload: any = {
                name: values.name,
                description: values.description || undefined,
                teacherIds: values.teacherIds,
              };
              if (
                !isEditing &&
                values.schedules &&
                values.schedules.length > 0 &&
                values.semesterType &&
                values.academicYearStart
              ) {
                payload.semesterType = values.semesterType;
                payload.academicYearStart = parseInt(
                  String(values.academicYearStart),
                  10,
                );
                payload.schedules = values.schedules.map((s) => ({
                  dayOfWeek: parseInt(String(s.dayOfWeek), 10),
                  startTime: s.startTime,
                  durationMinutes: parseInt(String(s.durationMinutes), 10) || 90,
                  repeatsWeekly: s.repeatsWeekly ?? true,
                }));
              }
              if (isEditing) {
                updateMutation.mutate({
                  id: subject.id,
                  data: {
                    name: payload.name,
                    description: payload.description,
                    teacherIds: payload.teacherIds,
                  },
                });
              } else {
                createMutation.mutate(payload);
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, values, setFieldValue }) => (
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
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profesori (obavezno)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {teachers.map((t) => {
                      const isSelected = values.teacherIds?.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(values.teacherIds || []), t.id]
                                : (values.teacherIds || []).filter((id) => id !== t.id);
                              setFieldValue('teacherIds', next);
                            }}
                            className="sr-only"
                          />
                          <span>
                            {t.firstName} {t.lastName}
                          </span>
                        </label>
                      );
                    })}
                    {teachers.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nema registrovanih profesora.
                      </p>
                    )}
                  </div>
                  <ErrorMessage
                    name="teacherIds"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {!isEditing && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                        Raspored časova
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Izaberite dane i vreme kada se održava predmet. Časovi
                        će se automatski generisati za ceo semester.
                      </p>

                      <div className="space-y-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Semestar
                            </label>
                            <Field
                              as="select"
                              name="semesterType"
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              {SEMESTER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Field>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Školska godina
                            </label>
                            <Field
                              as="select"
                              name="academicYearStart"
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              {getAcademicYearOptions().map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Field>
                          </div>
                        </div>

                        <FieldArray name="schedules">
                          {({ push, remove }) => (
                            <>
                              {values.schedules.map((_, index) => (
                                <div
                                  key={index}
                                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Čas {index + 1}
                                    </span>
                                    {values.schedules.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Dan
                                      </label>
                                      <Field
                                        as="select"
                                        name={`schedules.${index}.dayOfWeek`}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                                      >
                                        {DAY_NAMES.map((d) => (
                                          <option key={d.value} value={d.value}>
                                            {d.label}
                                          </option>
                                        ))}
                                      </Field>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Vreme
                                      </label>
                                      <Field
                                        type="time"
                                        name={`schedules.${index}.startTime`}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Trajanje (min)
                                      </label>
                                      <Field
                                        type="number"
                                        name={`schedules.${index}.durationMinutes`}
                                        min="15"
                                        max="240"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <label className="flex items-center space-x-2 cursor-pointer">
                                        <Field
                                          type="checkbox"
                                          name={`schedules.${index}.repeatsWeekly`}
                                          className="rounded"
                                        />
                                        <span className="text-sm">Svake nedelje</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  push({
                                    dayOfWeek: 1,
                                    startTime: '14:00',
                                    durationMinutes: 90,
                                    repeatsWeekly: true,
                                  })
                                }
                                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Plus className="w-4 h-4" />
                                Dodaj termin
                              </button>
                            </>
                          )}
                        </FieldArray>
                      </div>
                    </div>
                  </>
                )}

                {isEditing && subject?.schedules && subject.schedules.length > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Raspored (samo pregled):
                    </p>
                    {(subject as any).schedules.map((s: any, i: number) => (
                      <p key={i}>
                        {DAY_NAMES.find((d) => d.value === s.dayOfWeek)?.label}{' '}
                        {s.startTime} – {s.durationMinutes} min
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AdminSubjectModal;
