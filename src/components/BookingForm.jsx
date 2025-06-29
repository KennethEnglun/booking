import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { room } from "../websim.js";
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
  const personInChargePlaceholder = "\u8ACB\u8F38\u5165\u8CA0\u8CAC\u4EBA\u59D3\u540D";
  const purposePlaceholder = "\u4F8B\u5982\uFF1A\u5718\u968A\u6703\u8B70\u3001\u5BA2\u6236\u7C21\u5831\u7B49";
  const successRedirectDelay = 3e3;
  const maxBookingDays = 7;
  useEffect(() => {
    window.websim.getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        setPersonInCharge(user.username);
      }
    });
  }, []);
  const handleAddDate = () => {
    if (dates.length < maxBookingDays) {
      setDates((prev) => [...prev, dayjs(prev[prev.length - 1]).add(1, "day").format("YYYY-MM-DD")]);
    } else {
      setError(`\u4E00\u6B21\u6700\u591A\u53EA\u80FD\u9810\u7D04 ${maxBookingDays} \u5929\u3002`);
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
      setError("\u7121\u6CD5\u7372\u53D6\u7528\u6236\u4FE1\u606F\uFF0C\u8ACB\u5237\u65B0\u9801\u9762\u91CD\u8A66\u3002");
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    if (!personInCharge.trim()) {
      setError("\u8ACB\u586B\u5BEB\u8CA0\u8CAC\u4EBA\u59D3\u540D\u3002");
      setIsSubmitting(false);
      return;
    }
    if (dates.some((date) => !date)) {
      setError("\u6240\u6709\u65E5\u671F\u6B04\u4F4D\u90FD\u5FC5\u9808\u586B\u5BEB\u3002");
      setIsSubmitting(false);
      return;
    }
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length !== dates.length) {
      setError("\u8ACB\u79FB\u9664\u91CD\u8907\u7684\u9810\u7D04\u65E5\u671F\u3002");
      setIsSubmitting(false);
      return;
    }
    const bookingPromises = uniqueDates.map((date) => {
      const bookingDetails = {
        venue,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose.trim() || "\u672A\u63D0\u4F9B",
        person_in_charge: personInCharge,
        user_id: currentUser.id
      };
      if (dayjs(`${date} ${endTime}`).isSameOrBefore(dayjs(`${date} ${startTime}`))) {
        return Promise.resolve({ date, status: "failed", reason: "\u7D50\u675F\u6642\u9593\u5FC5\u9808\u665A\u65BC\u958B\u59CB\u6642\u9593" });
      }
      return room.collection("bookings_v2").filter({
        venue: bookingDetails.venue,
        booking_date: bookingDetails.booking_date
      }).getList().then((existingBookings) => {
        const newBookingStart = dayjs(`${date} ${startTime}`);
        const newBookingEnd = dayjs(`${date} ${endTime}`);
        const isConflict = existingBookings.some((booking) => {
          const existingStart = dayjs(`${booking.booking_date} ${booking.start_time}`);
          const existingEnd = dayjs(`${booking.booking_date} ${booking.end_time}`);
          return newBookingStart.isBefore(existingEnd) && existingStart.isBefore(newBookingEnd);
        });
        if (isConflict) {
          return { date, status: "failed", reason: "\u6642\u6BB5\u5DF2\u88AB\u9810\u7D04" };
        }
        return room.collection("bookings_v2").create(bookingDetails).then(() => ({
          date,
          status: "success"
        }));
      });
    });
    try {
      const results = await Promise.all(bookingPromises);
      const successfulBookings = results.filter((r) => r.status === "success");
      const failedBookings = results.filter((r) => r.status === "failed");
      let successMsg = "";
      let errorMsg = "";
      if (successfulBookings.length > 0) {
        successMsg = `\u6210\u529F\u9810\u7D04 ${successfulBookings.length} \u5929\uFF1A ${successfulBookings.map((b) => b.date).join(", ")}`;
        setPurpose("");
      }
      if (failedBookings.length > 0) {
        errorMsg = `\u6709 ${failedBookings.length} \u5929\u9810\u7D04\u5931\u6557\uFF1A
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
      console.error("Booking failed:", err);
      setError("\u7CFB\u7D71\u767C\u751F\u932F\u8AA4\uFF0C\u9810\u7D04\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full bg-white rounded-lg shadow-xl p-6 sm:p-8 overflow-y-auto", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold text-gray-800 mb-6", children: "\u5EFA\u7ACB\u65B0\u9810\u7D04" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 160,
      columnNumber: 13
    }),
    error && /* @__PURE__ */ jsxDEV("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 whitespace-pre-wrap", role: "alert", children: error }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 161,
      columnNumber: 23
    }),
    success && /* @__PURE__ */ jsxDEV("div", { className: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4", role: "alert", children: success }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 162,
      columnNumber: 25
    }),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "venue", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5834\u5730" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 165,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("select", { id: "venue", value: venue, onChange: (e) => setVenue(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", children: AVAILABLE_VENUES.map((v) => /* @__PURE__ */ jsxDEV("option", { value: v, children: v }, v, false, {
          fileName: "<stdin>",
          lineNumber: 167,
          columnNumber: 52
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 166,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 164,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\u65E5\u671F" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 172,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: dates.map((date, index) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "date",
              value: date,
              min: dayjs().format("YYYY-MM-DD"),
              onChange: (e) => handleDateChange(index, e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              required: true
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 176,
              columnNumber: 33
            }
          ),
          dates.length > 1 && /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => handleRemoveDate(index),
              className: "p-2 h-10 w-10 flex-shrink-0 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
              "aria-label": "\u79FB\u9664\u65E5\u671F",
              children: /* @__PURE__ */ jsxDEV("i", { className: "fa-solid fa-minus" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 191,
                columnNumber: 41
              })
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 185,
              columnNumber: 37
            }
          )
        ] }, index, true, {
          fileName: "<stdin>",
          lineNumber: 175,
          columnNumber: 29
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 173,
          columnNumber: 21
        }),
        dates.length < maxBookingDays && /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            onClick: handleAddDate,
            className: "w-full mt-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            children: [
              /* @__PURE__ */ jsxDEV("i", { className: "fa-solid fa-plus mr-2" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 203,
                columnNumber: 29
              }),
              "\u65B0\u589E\u9810\u7D04\u65E5\u671F"
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 198,
            columnNumber: 25
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 171,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { htmlFor: "start-time", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u958B\u59CB\u6642\u9593" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 210,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "time", id: "start-time", value: startTime, onChange: (e) => setStartTime(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", step: "900", required: true }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 211,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 209,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { htmlFor: "end-time", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7D50\u675F\u6642\u9593" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 214,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "time", id: "end-time", value: endTime, onChange: (e) => setEndTime(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", step: "900", required: true }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 215,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 213,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 208,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "person-in-charge", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8CA0\u8CAC\u4EBA\u59D3\u540D" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 219,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("input", { type: "text", id: "person-in-charge", value: personInCharge, onChange: (e) => setPersonInCharge(e.target.value), placeholder: personInChargePlaceholder, className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", required: true }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 220,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 218,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "purpose", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7528\u9014" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 223,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("input", { type: "text", id: "purpose", value: purpose, onChange: (e) => setPurpose(e.target.value), placeholder: purposePlaceholder, className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 224,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 222,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "pt-2", children: /* @__PURE__ */ jsxDEV("button", { type: "submit", disabled: isSubmitting || !!success, className: "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed", children: isSubmitting ? "\u63D0\u4EA4\u4E2D..." : success ? "\u9810\u7D04\u6210\u529F" : "\u78BA\u8A8D\u9810\u7D04" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 227,
        columnNumber: 21
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 226,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 163,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 159,
    columnNumber: 9
  });
};
export {
  BookingFormComponent
};
