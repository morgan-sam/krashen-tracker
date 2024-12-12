import { useState, useEffect } from "preact/hooks";
import { supabase } from "./supabase";

const Calendar = ({ email }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [yearInput, setYearInput] = useState(
    currentDate.getFullYear().toString()
  );
  const [monthlyData, setMonthlyData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fetch monthly data
  const fetchMonthlyData = async () => {
    if (!email) return;

    console.log("Fetching monthly data...");
    setIsLoading(true);

    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    try {
      const { data, error } = await supabase
        .from("time_logs")
        .select("date, total_seconds")
        .eq("email", email)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      console.log("Received data:", data);

      const dateMap = {};
      data.forEach((log) => {
        dateMap[log.date] = Math.round(log.total_seconds);
      });

      console.log("Setting monthly data:", dateMap);
      setMonthlyData(dateMap);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!email) return;

    console.log("Setting up realtime subscription for:", email);

    // Initial fetch
    fetchMonthlyData();

    const channelA = supabase
      .channel("changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "time_logs",
        },
        (payload) => {
          console.log("Received UPDATE:", payload);
          fetchMonthlyData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "time_logs",
        },
        (payload) => {
          console.log("Received INSERT:", payload);
          fetchMonthlyData();
        }
      )
      .subscribe(async (status, err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log("Subscription status:", status);
        }
      });

    return () => {
      console.log("Cleaning up subscription");
      channelA.unsubscribe();
    };
  }, [email]);

  // Refetch when month/year changes
  useEffect(() => {
    fetchMonthlyData();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1);
      setYearInput(newDate.getFullYear().toString());
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1);
      setYearInput(newDate.getFullYear().toString());
      return newDate;
    });
  };

  const handleMonthChange = (e) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), months.indexOf(e.target.value))
    );
  };

  const handleYearChange = (e) => {
    const value = e.target.value;
    setYearInput(value);
    if (value.length === 4 && !isNaN(value)) {
      setCurrentDate(new Date(parseInt(value), currentDate.getMonth()));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${hours}h ${formattedMinutes}m`;
    }
    return `${minutes}m`;
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-24 border border-gray-200 dark:border-gray-700"
        ></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dateString = date.toISOString().split("T")[0];
      const seconds = monthlyData[dateString];
      const isToday = new Date().toISOString().split("T")[0] === dateString;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 dark:border-gray-700 p-2 
            ${isWeekend ? "bg-gray-50 dark:bg-slate-900/50" : ""} 
            ${isToday ? "ring-2 ring-blue-500" : ""}
            transition-colors`}
        >
          <div className="flex flex-col h-full">
            <span
              className={`text-sm ${
                isToday ? "font-semibold" : ""
              } text-gray-800 dark:text-gray-200`}
            >
              {day}
            </span>
            {seconds > 0 && (
              <div className="mt-auto">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                  {formatTime(seconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderMonthSummary = () => {
    let totalSeconds = 0;
    Object.values(monthlyData).forEach((seconds) => {
      if (seconds) totalSeconds += seconds;
    });

    if (totalSeconds === 0) return null;

    return (
      <div className="min-h-[1.5rem] text-sm text-gray-600 dark:text-gray-300 mb-2">
        Monthly total: {formatTime(totalSeconds)}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200"
        >
          ←
        </button>

        <div className="flex items-center space-x-2">
          <select
            value={months[currentDate.getMonth()]}
            onChange={handleMonthChange}
            className="border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={yearInput}
            onChange={handleYearChange}
            className="border dark:border-gray-600 rounded px-2 py-1 w-20 text-center bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            maxLength="4"
          />
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200"
        >
          →
        </button>
      </div>

      {/* Monthly summary */}
      {renderMonthSummary()}

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-medium py-1 text-gray-800 dark:text-gray-200"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
    </div>
  );
};

export default Calendar;
