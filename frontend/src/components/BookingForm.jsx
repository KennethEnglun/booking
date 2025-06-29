import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { bookingAPI, userAPI } from "../utils/api.js";
import { AVAILABLE_VENUES } from "../config.js";

const BookingFormComponent = ({ onBookingSuccess }) => {
  const [venue, setVenue] = useState(AVAILABLE_VENUES[0]);
  const [dates, setDates] = useState([dayjs().format("YYYY-MM-DD")]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [personInCharge, setPersonInCharge] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const personInChargePlaceholder = "請輸入負責人姓名";
  const purposePlaceholder = "例如：團隊會議、客戶簡報等";
  const successRedirectDelay = 3000;
  const maxBookingDays = 7;

  useEffect(() => {
    // 獲取當前用戶信息
    const getCurrentUser = async () => {
      try {
        const user = await userAPI.getCurrentUser();
        setCurrentUser(user);
        if (user) {
          setPersonInCharge(user.username || user.name);
        }
      } catch (error) {
        console.error("無法獲取用戶信息:", error);
        // 如果沒有用戶系統，使用默認值
        setCurrentUser({ id: 'default', username: '訪客' });
        setPersonInCharge('訪客');
      }
    };
    
    getCurrentUser();
  }, []);

  const handleAddDate = () => {
    if (dates.length < maxBookingDays) {
      setDates((prev) => [...prev, dayjs(prev[prev.length - 1]).add(1, "day").format("YYYY-MM-DD")]);
    } else {
      setError(`一次最多只能預約 ${maxBookingDays} 天。`);
    }
  };

  const handleDateChange = (index, value) => {
    const newDates = [...dates];
    newDates[index] = value;
    setDates(newDates);
  };

  const handleRemoveDate = (index) => {
    if (dates.length > 1) {
      setDates((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("無法獲取用戶信息，請刷新頁面重試。");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (!personInCharge.trim()) {
      setError("請填寫負責人姓名。");
      setIsSubmitting(false);
      return;
    }

    if (dates.some((date) => !date)) {
      setError("所有日期欄位都必須填寫。");
      setIsSubmitting(false);
      return;
    }

    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length !== dates.length) {
      setError("請移除重複的預約日期。");
      setIsSubmitting(false);
      return;
    }

    const bookingPromises = uniqueDates.map(async (date) => {
      const bookingDetails = {
        venue,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose.trim() || "未提供",
        person_in_charge: personInCharge,
        user_id: currentUser.id
      };

      if (dayjs(`${date} ${endTime}`).isSameOrBefore(dayjs(`${date} ${startTime}`))) {
        return { date, status: "failed", reason: "結束時間必須晚於開始時間" };
      }

      try {
        // 檢查時間衝突
        const conflictCheck = await bookingAPI.checkConflict(venue, date, startTime, endTime);
        if (conflictCheck.hasConflict) {
          return { date, status: "failed", reason: "時段已被預約" };
        }

        // 創建預約
        await bookingAPI.create(bookingDetails);
        return { date, status: "success" };
      } catch (error) {
        console.error("預約失敗:", error);
        return { 
          date, 
          status: "failed", 
          reason: error.response?.data?.message || "系統發生錯誤，預約失敗，請稍後再試。" 
        };
      }
    });

    try {
      const results = await Promise.all(bookingPromises);
      const successfulBookings = results.filter((r) => r.status === "success");
      const failedBookings = results.filter((r) => r.status === "failed");

      let successMsg = "";
      let errorMsg = "";

      if (successfulBookings.length > 0) {
        successMsg = `成功預約 ${successfulBookings.length} 天： ${successfulBookings.map((b) => b.date).join(", ")}`;
        setPurpose("");
      }

      if (failedBookings.length > 0) {
        errorMsg = `有 ${failedBookings.length} 天預約失敗：
${failedBookings.map((b) => `${b.date} (${b.reason})`).join("\n")}`;
      }

      setSuccess(successMsg);
      setError(errorMsg);

      if (successfulBookings.length > 0) {
        setTimeout(() => {
          setSuccess("");
          if (onBookingSuccess) onBookingSuccess();
        }, successRedirectDelay);
      }
    } catch (err) {
      console.error("預約處理失敗:", err);
      setError("系統發生錯誤，預約失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl p-6 sm:p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">建立新預約</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 whitespace-pre-wrap" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
            場地
          </label>
          <select
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {AVAILABLE_VENUES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日期
          </label>
          <div className="space-y-2">
            {dates.map((date, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  min={dayjs().format("YYYY-MM-DD")}
                  onChange={(e) => handleDateChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {dates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(index)}
                    className="p-2 h-10 w-10 flex-shrink-0 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
            {dates.length < maxBookingDays && (
              <button
                type="button"
                onClick={handleAddDate}
                className="w-full px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                新增日期
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              開始時間
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              結束時間
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="personInCharge" className="block text-sm font-medium text-gray-700 mb-1">
            負責人
          </label>
          <input
            type="text"
            id="personInCharge"
            value={personInCharge}
            onChange={(e) => setPersonInCharge(e.target.value)}
            placeholder={personInChargePlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
            用途
          </label>
          <textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={purposePlaceholder}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              處理中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-calendar-plus mr-2"></i>
              建立預約
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export { BookingFormComponent }; 