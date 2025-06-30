import React, { useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { BookingFormComponent } from "./components/BookingForm.jsx";
import { ScheduleComponent } from "./components/Schedule.jsx";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

function App() {
  const [bookingChanged, setBookingChanged] = useState(0);

  const handleBookingSuccess = () => {
    setBookingChanged(c => c + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 h-screen flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          場地預約系統
        </h1>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <BookingFormComponent onBookingSuccess={handleBookingSuccess} />
        </div>
        <div className="h-full overflow-y-auto">
          <ScheduleComponent key={bookingChanged} />
        </div>
      </main>
    </div>
  );
}

export default App; 