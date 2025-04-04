// src/components/ui/demanda-calendar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DemandaEvent,
  PRIORIDADE_COLORS,
  STATUS_COLORS,
} from "@/types/demanda";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Notificar mudança de intervalo quando o mês mudar
  useEffect(() => {
    if (onRangeChange) {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      onRangeChange(start, end);
    }
  }, [currentMonth, onRangeChange]);

  // Renderizar cabeçalho com nome do mês e ano
  const renderHeader = () => {
    const dateFormat = "MMMM yyyy";
    return (
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded hover:bg-gray-200 text-gray-700">
          &lt;
        </button>
        <div className="text-xl font-bold text-gray-800">
          {format(currentMonth, dateFormat, { locale: ptBR })}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded hover:bg-gray-200 text-gray-700">
          &gt;
        </button>
      </div>
    );
  };

  // Renderizar dias da semana
  const renderDays = () => {
    const dateFormat = "EEEEEE";
    const days = [];
    let startDate = startOfWeek(currentMonth, { weekStartsOn: 0 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="w-full text-center font-semibold text-sm py-2">
          {format(addDays(startDate, i), dateFormat, {
            locale: ptBR,
          }).toUpperCase()}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  // Renderizar células do calendário
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Filtrar eventos por dia
    const getEventsForDay = (day: Date) => {
      return events.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return (
          (eventStart <= day && eventEnd >= day) ||
          isSameDay(eventStart, day) ||
          isSameDay(eventEnd, day)
        );
      });
    };

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d", { locale: ptBR });
        const cloneDay = day;
        const dayEvents = getEventsForDay(day);

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] p-1 border border-gray-200 ${
              !isSameMonth(day, monthStart)
                ? "bg-gray-100 text-gray-400"
                : isSameDay(day, selectedDate)
                  ? "bg-blue-50 text-blue-600"
                  : isSameDay(day, new Date())
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-white"
            }`}
            onClick={() => handleDateClick(cloneDay)}>
            <div className="text-right p-1">{formattedDate}</div>
            <div className="overflow-y-auto max-h-[80px]">
              {dayEvents.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  className="text-xs mb-1 p-1 rounded truncate cursor-pointer"
                  style={{
                    backgroundColor:
                      event.backgroundColor ||
                      STATUS_COLORS[event.extendedProps.status] ||
                      PRIORIDADE_COLORS[event.extendedProps.prioridade] ||
                      "#3788d8",
                    color: event.textColor || "#ffffff",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}>
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-white">{rows}</div>;
  };

  // Navegação do calendário
  const nextMonth = () => {
    setCurrentMonth((month) => addDays(month, 32));
  };

  const prevMonth = () => {
    setCurrentMonth((month) => addDays(month, -32));
  };

  // Lidar com clique em data
  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  // Lidar com clique no evento
  const handleEventClick = (event: DemandaEvent) => {
    router.push(`/demandas/${event.extendedProps.demandaId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[700px] overflow-auto">
      <div className="bg-white p-4 rounded-lg">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
};

export default DemandaCalendar;
