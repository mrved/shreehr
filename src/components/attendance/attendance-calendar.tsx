"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_minutes: number;
  status: string;
}

const statusColors: Record<string, string> = {
  PRESENT: "bg-green-500",
  HALF_DAY: "bg-yellow-500",
  ABSENT: "bg-red-500",
  ON_LEAVE: "bg-blue-500",
  HOLIDAY: "bg-purple-500",
  WEEKEND: "bg-gray-300",
};

export function AttendanceCalendar({ employeeId }: { employeeId?: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchAttendance();
  }, [year, month, employeeId]);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();

      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: "31",
      });

      if (employeeId) {
        params.set("employeeId", employeeId);
      }

      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      setAttendance(data.attendances || []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth() {
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

    return days;
  }

  function getAttendanceForDay(day: number) {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return attendance.find((a) => a.date.startsWith(dateStr));
  }

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const days = getDaysInMonth();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
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
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-12 sm:h-10" />;
                }

                const record = getAttendanceForDay(day);
                const isWeekend = new Date(year, month, day).getDay() % 6 === 0;
                const status = record?.status || (isWeekend ? "WEEKEND" : null);

                return (
                  <div
                    key={day}
                    className={cn(
                      "h-12 sm:h-10 flex items-center justify-center rounded text-sm relative",
                      status && statusColors[status],
                      status && "text-white",
                      !status && "hover:bg-muted",
                    )}
                    title={status ? `${status} - ${record?.work_minutes || 0} mins` : undefined}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1 text-xs">
                  <div className={cn("w-3 h-3 rounded", color)} />
                  <span>{status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
