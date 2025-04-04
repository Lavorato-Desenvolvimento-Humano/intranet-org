// src/components/ui/demanda-calendar.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  DemandaEvent,
  PRIORIDADE_COLORS,
  STATUS_COLORS,
} from "@/types/demanda";
import { useRouter } from "next/navigation";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configurar localização para português
moment.locale("pt-br");
const localizer = momentLocalizer(moment);

interface DemandaCalendarProps {
  events: DemandaEvent[];
  onRangeChange?: (start: Date, end: Date) => void;
  isLoading?: boolean;
}

const DemandaCalendar: React.FC<DemandaCalendarProps> = ({
  events,
  onRangeChange,
  isLoading = false,
}) => {
  const router = useRouter();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Transformar eventos para o formato do calendário
  useEffect(() => {
    if (events && events.length > 0) {
      const formattedEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        backgroundColor:
          event.backgroundColor ||
          STATUS_COLORS[event.extendedProps.status] ||
          PRIORIDADE_COLORS[event.extendedProps.prioridade] ||
          "#3788d8",
        borderColor:
          event.borderColor ||
          STATUS_COLORS[event.extendedProps.status] ||
          "#3788d8",
        textColor: event.textColor || "#ffffff",
        demandaId: event.extendedProps.demandaId,
        prioridade: event.extendedProps.prioridade,
        status: event.extendedProps.status,
        atribuidoParaNome: event.extendedProps.atribuidoParaNome,
      }));
      setCalendarEvents(formattedEvents);
    } else {
      setCalendarEvents([]);
    }
  }, [events]);

  // Estilo personalizado para eventos
  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        color: event.textColor,
      },
    };
  };

  // Lidar com clique no evento
  const handleEventClick = (event: any) => {
    router.push(`/demandas/${event.demandaId}`);
  };

  // Lidar com mudança de intervalo do calendário
  const handleRangeChange = (range: any) => {
    if (onRangeChange) {
      // Se for visualização de mês
      if (range.start && range.end) {
        onRangeChange(range.start, range.end);
      }
      // Se for visualização de semana ou dia
      else if (Array.isArray(range) && range.length > 0) {
        const start = new Date(Math.min(...range.map((d) => d.getTime())));
        const end = new Date(Math.max(...range.map((d) => d.getTime())));
        onRangeChange(start, end);
      }
    }
  };

  // Componente personalizado para o título do evento
  const EventComponent = ({ event }: { event: any }) => (
    <div className="truncate">
      <div className="font-medium">{event.title}</div>
      <div className="text-xs">{event.atribuidoParaNome}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[700px]">
      <BigCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
        onRangeChange={handleRangeChange}
        components={{
          event: EventComponent,
        }}
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Não há demandas neste período",
        }}
      />
    </div>
  );
};

export default DemandaCalendar;
