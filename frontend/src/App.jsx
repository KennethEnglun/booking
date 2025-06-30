import React, { useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { BookingFormComponent } from "./components/BookingForm.jsx";
import { ChatComponent } from "./components/Chat.jsx";
import { ScheduleComponent } from "./components/Schedule.jsx";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

function App() {
  const [view, setView] = useState("booking");

  return (
    <div className="w-full max-w-4xl mx-auto p-4 h-[calc(100vh-2rem)] flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          智能場地預約系統
        </h1>
        <p className="text-center text-gray-500">
          透過表單或對話式AI來管理您的預約
        </p>
      </header>

      <div className="flex justify-center mb-4 bg-gray-200 rounded-full p-1">
        <button
          onClick={() => setView("booking")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
            view === "booking" ? "bg-white text-blue-600 shadow" : "text-gray-600"
          }`}
        >
          <i className="fa-regular fa-pen-to-square mr-2"></i>
          表單預約
        </button>
        <button
          onClick={() => setView("chat")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
            view === "chat" ? "bg-white text-blue-600 shadow" : "text-gray-600"
          }`}
        >
          <i className="fa-regular fa-comments mr-2"></i>
          AI 預約
        </button>
        <button
          onClick={() => setView("schedule")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
            view === "schedule" ? "bg-white text-blue-600 shadow" : "text-gray-600"
          }`}
        >
          <i className="fa-regular fa-calendar-days mr-2"></i>
          查看時間表
        </button>
      </div>

      <main className="flex-1 overflow-hidden">
        {view === "booking" && (
          <BookingFormComponent onBookingSuccess={() => setView("schedule")} />
        )}
        {view === "chat" && <ChatComponent />}
        {view === "schedule" && <ScheduleComponent />}
      </main>
    </div>
  );
}

export default App; 