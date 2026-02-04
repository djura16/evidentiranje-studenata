import { useQuery } from '@tanstack/react-query';
import { classesApi, ClassSession } from '../../services/api';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useMemo } from 'react';

const localizer = momentLocalizer(moment);

const StudentCalendar: React.FC = () => {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll().then((res) => res.data),
  });

  const events = useMemo(() => {
    return (
      classes?.map((classSession) => ({
        title: classSession.subject?.name || 'Nepoznat predmet',
        start: new Date(classSession.startTime),
        end: new Date(classSession.endTime),
        resource: classSession,
      })) || []
    );
  }, [classes]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const eventStyleGetter = (event: any) => {
    const classSession = event.resource as ClassSession;
    const backgroundColor = classSession.isActive ? '#10b981' : '#6b7280';
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Kalendar časova
      </h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: 'Sledeći',
            previous: 'Prethodni',
            today: 'Danas',
            month: 'Mesec',
            week: 'Nedelja',
            day: 'Dan',
            agenda: 'Agenda',
            date: 'Datum',
            time: 'Vreme',
            event: 'Događaj',
            noEventsInRange: 'Nema časova u ovom periodu',
          }}
        />
      </motion.div>
    </div>
  );
};

export default StudentCalendar;
