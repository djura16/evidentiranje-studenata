import { useQuery } from '@tanstack/react-query';
import { classesApi, ClassSession } from '../../services/api';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useMemo } from 'react';

const localizer = momentLocalizer(moment);

const minTime = new Date(2000, 0, 1, 7, 0, 0);
const maxTime = new Date(2000, 0, 1, 22, 0, 0);

const TeacherCalendar: React.FC = () => {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['teacher-classes-calendar'],
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
    const backgroundColor = classSession.isActive ? '#22c55e' : '#007bff';
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
        Raspored časova
      </h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="min-w-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          defaultView="work_week"
          views={['work_week', 'month']}
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
            agendaTimeFormat: 'HH:mm',
            agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
          }}
          messages={{
            next: 'Sledeći',
            previous: 'Prethodni',
            today: 'Danas',
            month: 'Mesec',
            week: 'Nedelja',
            work_week: 'Nedelja',
            day: 'Dan',
            agenda: 'Agenda',
            date: 'Datum',
            time: 'Vreme',
            event: 'Događaj',
            noEventsInRange: 'Nema časova u ovom periodu',
          }}
          culture="sr-RS"
          min={minTime}
          max={maxTime}
        />
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherCalendar;
