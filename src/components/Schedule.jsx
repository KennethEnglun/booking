import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { useQuery } from "@websim/use-query";
import dayjs from "dayjs";
import { room } from "../websim.js";
import { SUCCESS_MSG_VISIBILITY_DURATION, AVAILABLE_VENUES } from "../config.js";
const allBookingsTitle = "\u6240\u6709\u9810\u7D04";
const dateFilterTitleFormat = "{date} \u7684\u9810\u7D04";
const venueFilterTitleFormat = "\u300C{venue}\u300D\u7684\u6240\u6709\u9810\u7D04";
const bothFiltersTitleFormat = "\u300C{venue}\u300D\u65BC {date} \u7684\u9810\u7D04";
const ScheduleComponent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterVenue, setFilterVenue] = useState("");
  const [filterDate, setFilterDate] = useState("");
  useEffect(() => {
    window.websim.getCurrentUser().then(setCurrentUser);
  }, []);
  const { data: bookings, loading } = useQuery(room.query(
    `SELECT b.id, b.venue, b.purpose, b.booking_date, b.start_time, b.end_time, b.user_id, b.person_in_charge, u.username
         FROM public.bookings_v2 AS b
         JOIN public.user AS u ON b.user_id = u.id
         ORDER BY b.booking_date ASC, b.start_time ASC`
  ));
  const handleDelete = async (bookingId) => {
    if (window.confirm("\u78BA\u5B9A\u8981\u53D6\u6D88\u9019\u500B\u9810\u7D04\u55CE\uFF1F")) {
      try {
        await room.collection("bookings_v2").delete(bookingId);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), SUCCESS_MSG_VISIBILITY_DURATION);
      } catch (error) {
        console.error("Failed to delete booking:", error);
        alert("\u522A\u9664\u5931\u6557\uFF0C\u4F60\u53EF\u80FD\u6C92\u6709\u6B0A\u9650\u6216\u767C\u751F\u7DB2\u7D61\u932F\u8AA4\u3002");
      }
    }
  };
  const uniqueDates = bookings ? [...new Set(bookings.map((b) => b.booking_date))].sort((a, b) => new Date(a) - new Date(b)) : [];
  const filteredBookings = bookings?.filter((booking) => {
    const venueMatch = filterVenue ? booking.venue === filterVenue : true;
    const dateMatch = filterDate ? booking.booking_date === filterDate : true;
    return venueMatch && dateMatch;
  });
  let displayTitle;
  let groupedBookings;
  let groupingKeyIsVenue = false;
  if (filterVenue && filterDate) {
    displayTitle = bothFiltersTitleFormat.replace("{venue}", filterVenue).replace("{date}", dayjs(filterDate).format("YYYY\u5E74MM\u6708DD\u65E5"));
  } else if (filterVenue) {
    displayTitle = venueFilterTitleFormat.replace("{venue}", filterVenue);
  } else if (filterDate) {
    displayTitle = dateFilterTitleFormat.replace("{date}", dayjs(filterDate).format("YYYY\u5E74MM\u6708DD\u65E5"));
  } else {
    displayTitle = allBookingsTitle;
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
      displayTitle = venueFilterTitleFormat.replace("{venue}", filterVenue);
    }
    groupedBookings = filteredBookings?.reduce((acc, booking) => {
      const date = booking.booking_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(booking);
      return acc;
    }, {});
  }
  if (loading) return /* @__PURE__ */ jsxDEV("div", { className: "text-center p-10", children: "\u8B80\u53D6\u4E2D..." }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 90,
    columnNumber: 25
  });
  return /* @__PURE__ */ jsxDEV("div", { className: "p-4 sm:p-6 space-y-6 overflow-y-auto h-full relative", children: [
    showSuccess && /* @__PURE__ */ jsxDEV("div", { className: "fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50", children: "\u9810\u7D04\u5DF2\u6210\u529F\u53D6\u6D88\uFF01" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 95,
      columnNumber: 17
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row gap-4 p-4 bg-gray-100 rounded-lg sticky top-0 z-10", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "venue-filter", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7BE9\u9078\u5730\u9EDE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 102,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("select", { id: "venue-filter", value: filterVenue, onChange: (e) => setFilterVenue(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", children: [
          /* @__PURE__ */ jsxDEV("option", { value: "", children: "\u6240\u6709\u5730\u9EDE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 104,
            columnNumber: 25
          }),
          AVAILABLE_VENUES.map((v) => /* @__PURE__ */ jsxDEV("option", { value: v, children: v }, v, false, {
            fileName: "<stdin>",
            lineNumber: 105,
            columnNumber: 52
          }))
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 103,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 101,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "date-filter", className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7BE9\u9078\u65E5\u671F" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 109,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("select", { id: "date-filter", value: filterDate, onChange: (e) => setFilterDate(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", disabled: !uniqueDates.length, children: [
          /* @__PURE__ */ jsxDEV("option", { value: "", children: "\u6240\u6709\u65E5\u671F" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 111,
            columnNumber: 25
          }),
          uniqueDates.map((date) => /* @__PURE__ */ jsxDEV("option", { value: date, children: dayjs(date).format("YYYY-MM-DD (dddd)") }, date, false, {
            fileName: "<stdin>",
            lineNumber: 112,
            columnNumber: 50
          }))
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 110,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 108,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 100,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold text-gray-800", children: displayTitle }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 117,
      columnNumber: 13
    }),
    groupedBookings && Object.keys(groupedBookings).length > 0 ? Object.entries(groupedBookings).map(([groupKey, bookingsInGroup]) => /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("h3", { className: "text-xl sm:text-2xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-blue-500", children: groupingKeyIsVenue ? groupKey : dayjs(groupKey).format("YYYY\u5E74MM\u6708DD\u65E5 (dddd)") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 122,
        columnNumber: 25
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: bookingsInGroup.map((b) => /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-lg shadow-md p-4 flex flex-col justify-between schedule-card", children: [
        /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center mb-2", children: [
          /* @__PURE__ */ jsxDEV("img", { src: `https://images.websim.com/avatar/${b.username}`, alt: b.username, className: "w-10 h-10 rounded-full mr-3 border-2 border-gray-200" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 130,
            columnNumber: 45
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("p", { className: "font-semibold text-gray-800", children: b.person_in_charge }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 132,
              columnNumber: 49
            }),
            /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-gray-500", children: b.venue }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 133,
              columnNumber: 49
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 131,
            columnNumber: 45
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 129,
          columnNumber: 41
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 128,
          columnNumber: 37
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "mt-2 pt-2 border-t border-gray-100", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-lg font-medium text-blue-600", children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fa-regular fa-clock mr-2" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 138,
              columnNumber: 88
            }),
            b.start_time,
            " - ",
            b.end_time
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 138,
            columnNumber: 39
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "text-gray-600 mt-1", children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fa-solid fa-bullseye mr-2" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 139,
              columnNumber: 73
            }),
            "\u7528\u9014: ",
            b.purpose
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 139,
            columnNumber: 39
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-gray-400 mt-2", children: [
            "\u7531 ",
            b.username,
            " \u9810\u7D04"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 140,
            columnNumber: 39
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 137,
          columnNumber: 37
        }),
        currentUser && currentUser.id === b.user_id && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => handleDelete(b.id),
            className: "absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors",
            "aria-label": "\u53D6\u6D88\u9810\u7D04",
            children: /* @__PURE__ */ jsxDEV("i", { className: "fas fa-times-circle" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 148,
              columnNumber: 45
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 143,
            columnNumber: 41
          }
        )
      ] }, b.id, true, {
        fileName: "<stdin>",
        lineNumber: 127,
        columnNumber: 33
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 125,
        columnNumber: 25
      })
    ] }, groupKey, true, {
      fileName: "<stdin>",
      lineNumber: 121,
      columnNumber: 21
    })) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fa-regular fa-calendar-xmark text-5xl text-gray-400" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 158,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("p", { className: "mt-4 text-xl text-gray-500", children: "\u6C92\u6709\u7B26\u5408\u689D\u4EF6\u7684\u9810\u7D04" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 159,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 157,
      columnNumber: 17
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 93,
    columnNumber: 9
  });
};
export {
  ScheduleComponent
};
