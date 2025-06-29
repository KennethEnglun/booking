import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { bookingAPI, userAPI } from "../utils/api.js";
import { SUCCESS_MSG_VISIBILITY_DURATION, AVAILABLE_VENUES } from "../config.js";

const ScheduleComponent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterVenue, setFilterVenue] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await userAPI.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("無法獲取用戶信息:", error);
        setCurrentUser({ id: 'default', username: '訪客' });
      }
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getAll();
      setBookings(data);
      setError("");
    } catch (error) {
      console.error("獲取預約失敗:", error);
      setError("無法載入預約資料，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm("確定要取消這個預約嗎？")) {
      try {
        await bookingAPI.delete(bookingId);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), SUCCESS_MSG_VISIBILITY_DURATION);
        // 重新載入預約列表
        fetchBookings();
      } catch (error) {
        console.error("刪除預約失敗:", error);
        alert("刪除失敗，你可能沒有權限或發生網路錯誤。");
      }
    }
  };

  const uniqueDates = bookings 
    ? [...new Set(bookings.map((b) => b.booking_date))].sort((a, b) => new Date(a) - new Date(b)) 
    : [];

  const filteredBookings = bookings?.filter((booking) => {
    const venueMatch = filterVenue ? booking.venue === filterVenue : true;
    const dateMatch = filterDate ? booking.booking_date === filterDate : true;
    return venueMatch && dateMatch;
  });

  let displayTitle;
  let groupedBookings;
  let groupingKeyIsVenue = false;

  if (filterVenue && filterDate) {
    displayTitle = `「${filterVenue}」於 ${dayjs(filterDate).format("YYYY年MM月DD日")} 的預約`;
  } else if (filterVenue) {
    displayTitle = `「${filterVenue}」的所有預約`;
  } else if (filterDate) {
    displayTitle = `${dayjs(filterDate).format("YYYY年MM月DD日")} 的預約`;
  } else {
    displayTitle = "所有預約";
  }

  if (filterDate) {
    groupingKeyIsVenue = true;
    groupedBookings = filteredBookings?.reduce((acc, booking) => {
      const venue = booking.venue;
      if (!acc[venue]) acc[venue] = [];
      acc[venue].push(booking);
      return acc;
    }, {});
  } else {
    if (filterVenue) {
      displayTitle = `「${filterVenue}」的所有預約`;
    }
    groupedBookings = filteredBookings?.reduce((acc, booking) => {
      const date = booking.booking_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(booking);
      return acc;
    }, {});
  }

  if (loading) {
    return (
      <div className="text-center p-10">
        讀取中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full relative">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          預約已成功取消！
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-100 rounded-lg sticky top-0 z-10">
        <div className="flex-1">
          <label htmlFor="venue-filter" className="block text-sm font-medium text-gray-700 mb-1">
            篩選地點
          </label>
          <select
            id="venue-filter"
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">所有地點</option>
            {AVAILABLE_VENUES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
            篩選日期
          </label>
          <select
            id="date-filter"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={!uniqueDates.length}
          >
            <option value="">所有日期</option>
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {dayjs(date).format("YYYY-MM-DD (dddd)")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800">{displayTitle}</h2>

      {groupedBookings && Object.keys(groupedBookings).length > 0 ? (
        Object.entries(groupedBookings).map(([groupKey, bookingsInGroup]) => (
          <div key={groupKey}>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-blue-500">
              {groupingKeyIsVenue ? groupKey : dayjs(groupKey).format("YYYY年MM月DD日 (dddd)")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookingsInGroup.map((b) => (
                <div key={b.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between schedule-card">
                  <div>
                    <div className="flex items-center mb-2">
                      <img
                        src={`https://images.websim.com/avatar/${b.username || b.person_in_charge}`}
                        alt={b.username || b.person_in_charge}
                        className="w-10 h-10 rounded-full mr-3 border-2 border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{b.person_in_charge}</p>
                        <p className="text-sm text-gray-500">{b.venue}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-lg font-medium text-blue-600">
                      <i className="fa-regular fa-clock mr-2"></i>
                      {b.start_time} - {b.end_time}
                    </p>
                    
                    {b.purpose && (
                      <p className="text-sm text-gray-600 mt-1">
                        <i className="fa-regular fa-file-lines mr-1"></i>
                        {b.purpose}
                      </p>
                    )}
                    
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <i className="fa-solid fa-trash mr-1"></i>
                        取消預約
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-gray-500">
          <i className="fa-regular fa-calendar-xmark text-4xl mb-4"></i>
          <p>沒有找到預約記錄</p>
        </div>
      )}
    </div>
  );
};

export { ScheduleComponent }; 