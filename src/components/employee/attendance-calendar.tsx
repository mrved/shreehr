"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Attendance {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_minutes: number;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | "ON_LEAVE";
}

interface AttendanceCalendarProps {
  attendances: Attendance[];
  month: number;
  year: number;
  onMonthChange?: (month: number, year: number) => void;
}

const statusColors = {
  PRESENT: "bg-green-100 text-green-800 border-green-300",
  HALF_DAY: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ABSENT: "bg-red-100 text-red-800 border-red-300",
  ON_LEAVE: "bg-blue-100 text-blue-800 border-blue-300",
  WEEKEND: "bg-gray-100 text-gray-500 border-gray-200",
};

export function AttendanceCalendar({
  attendances,
  month,
  year,
  onMonthChange,
}: AttendanceCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Calculate monthly summary
  const summary = {
    present: attendances.filter((a) => a.status === "PRESENT").length,
    absent: attendances.filter((a) => a.status === "ABSENT").length,
    leave: attendances.filter((a) => a.status === "ON_LEAVE").length,
    halfDay: attendances.filter((a) => a.status === "HALF_DAY").length,
  };

  // Get calendar days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Get attendance for a specific day
  const getAttendanceForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return attendances.find((a) => a.date.startsWith(dateStr));
  };

  // Check if day is weekend
  const isWeekend = (day: number) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Check if day is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // Handle month navigation
  const previousMonth = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onMonthChange?.(newMonth, newYear);
  };

  const nextMonth = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onMonthChange?.(newMonth, newYear);
  };

  const monthName = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedAttendance = selectedDay ? getAttendanceForDay(selectedDay) : null;

  return (
    <div className="space-y-4">
      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{summary.present}</div>
            <div className="text-sm text-green-600">Present</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{summary.absent}</div>
            <div className="text-sm text-red-600">Absent</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{summary.leave}</div>
            <div className="text-sm text-blue-600">On Leave</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{summary.halfDay}</div>
            <div className="text-sm text-yellow-600">Half Day</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{monthName}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const attendance = getAttendanceForDay(day);
              const weekend = isWeekend(day);
              const today = isToday(day);
              const status = attendance?.status || (weekend ? "WEEKEND" : null);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "aspect-square p-1 text-center text-sm rounded border touch-manipulation transition-all",
                    status && statusColors[status],
                    !status && "hover:bg-muted border-transparent",
                    today && "ring-2 ring-primary ring-offset-2",
                    selectedDay === day && "ring-2 ring-offset-1",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details (Mobile Bottom Sheet Style) */}
      {selectedDay && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">
              {new Date(year, month, selectedDay).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedAttendance ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      "text-sm font-medium px-2 py-1 rounded",
                      statusColors[selectedAttendance.status],
                    )}
                  >
                    {selectedAttendance.status.replace("_", " ")}
                  </span>
                </div>
                {selectedAttendance.check_in && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Check In</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedAttendance.check_in).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {selectedAttendance.check_out && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Check Out</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedAttendance.check_out).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Work Hours</span>
                  <span className="text-sm font-medium">
                    {(selectedAttendance.work_minutes / 60).toFixed(1)} hrs
                  </span>
                </div>
              </>
            ) : isWeekend(selectedDay) ? (
              <p className="text-sm text-muted-foreground text-center py-4">Weekend</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No attendance record</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
