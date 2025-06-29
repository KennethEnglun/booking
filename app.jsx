import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { BookingFormComponent } from "./src/components/BookingForm.jsx";
import { ChatComponent } from "./src/components/Chat.jsx";
import { ScheduleComponent } from "./src/components/Schedule.jsx";
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
function App() {
  const [view, setView] = useState("booking");
  return /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-4xl mx-auto p-4 h-[calc(100vh-2rem)] flex flex-col", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "mb-4", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "text-3xl font-bold text-center text-gray-800", children: "\u667A\u80FD\u5834\u5730\u9810\u7D04\u7CFB\u7D71" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 19,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-center text-gray-500", children: "\u900F\u904E\u8868\u55AE\u6216\u5C0D\u8A71\u5F0FAI\u4F86\u7BA1\u7406\u60A8\u7684\u9810\u7D04" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 20,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 18,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center mb-4 bg-gray-200 rounded-full p-1", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setView("booking"),
          className: `px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${view === "booking" ? "bg-white text-blue-600 shadow" : "text-gray-600"}`,
          children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fa-regular fa-pen-to-square mr-2" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 27,
              columnNumber: 21
            }, this),
            "\u8868\u55AE\u9810\u7D04"
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 23,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setView("chat"),
          className: `px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${view === "chat" ? "bg-white text-blue-600 shadow" : "text-gray-600"}`,
          children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fa-regular fa-comments mr-2" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 33,
              columnNumber: 21
            }, this),
            "AI \u9810\u7D04"
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 29,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setView("schedule"),
          className: `px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${view === "schedule" ? "bg-white text-blue-600 shadow" : "text-gray-600"}`,
          children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fa-regular fa-calendar-days mr-2" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 39,
              columnNumber: 21
            }, this),
            "\u67E5\u770B\u6642\u9593\u8868"
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 35,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 22,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("main", { className: "flex-1 overflow-hidden", children: [
      view === "booking" && /* @__PURE__ */ jsxDEV(BookingFormComponent, { onBookingSuccess: () => setView("schedule") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 41
      }, this),
      view === "chat" && /* @__PURE__ */ jsxDEV(ChatComponent, {}, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 38
      }, this),
      view === "schedule" && /* @__PURE__ */ jsxDEV(ScheduleComponent, {}, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 45,
        columnNumber: 42
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 42,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 17,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 52,
  columnNumber: 13
}));
