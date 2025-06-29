import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef } from "react";
import { room } from "../websim.js";
import { parseBookingRequest } from "../utils/bookingParser.js";
import { AVAILABLE_VENUES } from "../config.js";
const Message = ({ msg }) => {
  const isUser = msg.sender === "user";
  const bubbleClass = isUser ? "chat-bubble user" : "chat-bubble ai";
  const avatarUrl = isUser && msg.avatar ? msg.avatar : "https://images.websim.com/avatar/websim-assistant";
  const avatar = /* @__PURE__ */ jsxDEV("img", { src: avatarUrl, alt: "avatar", className: "w-8 h-8 rounded-full" }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 10,
    columnNumber: 20
  });
  return /* @__PURE__ */ jsxDEV("div", { className: `flex items-end gap-2 my-2 ${isUser ? "flex-row-reverse" : "flex-row"}`, children: [
    avatar,
    /* @__PURE__ */ jsxDEV("div", { className: `${bubbleClass}`, children: msg.text }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 13,
    columnNumber: 9
  });
};
const ChatComponent = () => {
  const [messages, setMessages] = useState([
    { sender: "ai", text: `\u4F60\u597D\uFF01\u8ACB\u554F\u60F3\u9810\u7D04\u908A\u500B\u5834\u5730\u540C\u6642\u9593\uFF1F\u6211\u53EF\u4EE5\u5E6B\u4F60\u8655\u7406\u3002\u4F8B\u5982\uFF1A\u300C\u6211\u60F3\u9810\u7D04\u807D\u65E5\u4E0B\u53482\u9EDE\u52304\u9EDE\u5605\u6703\u8B70\u5BA4 A \u958B\u6703\u300D` }
  ]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [isThinking, setIsThinking] = useState(false);
  const [bookingState, setBookingState] = useState({
    stage: "idle",
    // idle, awaiting_venue, awaiting_date, awaiting_time, confirming
    details: {}
  });
  useEffect(() => {
    window.websim.getCurrentUser().then(setCurrentUser);
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);
  const addMessage = (sender, text, avatar = null) => {
    setMessages((prev) => [...prev, { sender, text, avatar }]);
  };
  const processBookingLogic = async (bookingDetails) => {
    setIsThinking(true);
    addMessage("ai", `\u6536\u5230\uFF01\u6B63\u5728\u70BA\u4F60\u67E5\u8A62 ${bookingDetails.booking_date} ${bookingDetails.start_time}-${bookingDetails.end_time} \u5605\u300C${bookingDetails.venue}\u300D...`);
    const aiThinkingDelay = 500;
    await new Promise((resolve) => setTimeout(resolve, aiThinkingDelay));
    const existingBookings = await room.collection("bookings_v2").filter({
      venue: bookingDetails.venue,
      booking_date: bookingDetails.booking_date
    }).getList();
    const isConflict = existingBookings.some(
      (booking) => bookingDetails.start_time < booking.end_time && bookingDetails.end_time > booking.start_time
    );
    if (isConflict) {
      addMessage("ai", `\u62B1\u6B49\uFF0C${bookingDetails.venue} \u55BA ${bookingDetails.booking_date} ${bookingDetails.start_time}-${bookingDetails.end_time} \u5DF2\u7D93\u88AB\u9810\u7D04\u3002\u8ACB\u9078\u64C7\u5176\u4ED6\u6642\u9593\u3002`);
      setBookingState({ stage: "idle", details: {} });
    } else {
      try {
        await room.collection("bookings_v2").create({
          ...bookingDetails,
          purpose: bookingDetails.purpose || "\u672A\u63D0\u4F9B",
          user_id: currentUser.id
        });
        addMessage("ai", `\u2705 \u9810\u7D04\u6210\u529F\uFF01
\u5834\u5730: ${bookingDetails.venue}
\u65E5\u671F: ${bookingDetails.booking_date}
\u6642\u9593: ${bookingDetails.start_time} - ${bookingDetails.end_time}
\u7528\u9014: ${bookingDetails.purpose || "\u672A\u63D0\u4F9B"}`);
        setBookingState({ stage: "idle", details: {} });
      } catch (error) {
        console.error("Booking failed:", error);
        addMessage("ai", "\u7CFB\u7D71\u767C\u751F\u932F\u8AA4\uFF0C\u9810\u7D04\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002");
        setBookingState({ stage: "idle", details: {} });
      }
    }
    setIsThinking(false);
  };
  const handleSend = async () => {
    if (!input.trim() || !currentUser || isThinking) return;
    const userMessage = input;
    addMessage("user", userMessage, `https://images.websim.com/avatar/${currentUser.username}`);
    setInput("");
    setIsThinking(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (bookingState.stage !== "idle") {
      let details = { ...bookingState.details };
      let nextStage = bookingState.stage;
      if (bookingState.stage === "awaiting_venue") {
        const venueMatch = AVAILABLE_VENUES.find((v) => userMessage.includes(v));
        if (venueMatch) {
          details.venue = venueMatch;
          nextStage = "awaiting_date";
          addMessage("ai", `\u597D\u5605\uFF0C\u9810\u7D04 ${venueMatch}\u3002\u8ACB\u554F\u4FC2\u908A\u4E00\u65E5\uFF1F (\u4F8B\u5982: \u807D\u65E5, 12\u670825\u65E5)`);
        } else {
          addMessage("ai", `\u5514\u597D\u610F\u601D\uFF0C\u6211\u5730\u53EA\u6709\u4EE5\u4E0B\u5834\u5730: ${AVAILABLE_VENUES.join(", ")}\u3002\u8ACB\u518D\u9078\u64C7\u4E00\u6B21\u3002`);
        }
      } else if (bookingState.stage === "awaiting_date") {
        const parsed = parseBookingRequest(userMessage);
        if (parsed && parsed.booking_date) {
          details.booking_date = parsed.booking_date;
          nextStage = "awaiting_time";
          addMessage("ai", `\u6536\u5230\uFF0C\u65E5\u671F\u4FC2 ${details.booking_date}\u3002\u8ACB\u554F\u4FC2\u5E7E\u9EDE\u5230\u5E7E\u9EDE\uFF1F (\u4F8B\u5982: \u4E0B\u53482\u9EDE\u52304\u9EDE)`);
        } else {
          addMessage("ai", "\u62B1\u6B49\uFF0C\u672A\u80FD\u8B58\u5225\u65E5\u671F\uFF0C\u8ACB\u7528\u300CX\u6708X\u65E5\u300D\u6216\u300C\u807D\u65E5\u300D\u7B49\u683C\u5F0F\u518D\u8A66\u4E00\u6B21\u3002");
        }
      } else if (bookingState.stage === "awaiting_time") {
        const parsed = parseBookingRequest(userMessage);
        if (parsed && parsed.start_time) {
          details.start_time = parsed.start_time;
          details.end_time = parsed.end_time;
          details.person_in_charge = currentUser.username;
          nextStage = "confirming";
          await processBookingLogic(details);
        } else {
          addMessage("ai", "\u62B1\u6B49\uFF0C\u672A\u80FD\u8B58\u5225\u6642\u9593\uFF0C\u8ACB\u7528\u300CX\u9EDE\u5230Y\u9EDE\u300D\u683C\u5F0F\u518D\u8A66\u4E00\u6B21\u3002");
        }
      }
      setBookingState({ stage: nextStage, details });
    } else {
      const parsedDetails = parseBookingRequest(userMessage);
      if (parsedDetails && parsedDetails.venue && parsedDetails.booking_date && parsedDetails.start_time) {
        const fullDetails = {
          ...parsedDetails,
          person_in_charge: currentUser.username
          // Assign current user as person in charge
        };
        await processBookingLogic(fullDetails);
      } else {
        let updatedDetails = parsedDetails || {};
        let nextStage = "idle";
        if (!updatedDetails.venue) {
          nextStage = "awaiting_venue";
          addMessage("ai", `\u6536\u5230\uFF01\u8ACB\u554F\u4F60\u60F3\u9810\u7D04\u908A\u500B\u5834\u5730\uFF1F\u6211\u5730\u6709\uFF1A${AVAILABLE_VENUES.join("\u3001")}`);
        } else if (!updatedDetails.booking_date) {
          nextStage = "awaiting_date";
          addMessage("ai", `\u597D\u5605\uFF0C\u9810\u7D04 ${updatedDetails.venue}\u3002\u8ACB\u554F\u4FC2\u908A\u4E00\u65E5\uFF1F (\u4F8B\u5982: \u807D\u65E5, 12\u670825\u65E5)`);
        } else if (!updatedDetails.start_time) {
          nextStage = "awaiting_time";
          addMessage("ai", `\u6536\u5230\uFF0C\u65E5\u671F\u4FC2 ${updatedDetails.booking_date}\u3002\u8ACB\u554F\u4FC2\u5E7E\u9EDE\u5230\u5E7E\u9EDE\uFF1F (\u4F8B\u5982: \u4E0B\u53482\u9EDE\u52304\u9EDE)`);
        }
        setBookingState({ stage: nextStage, details: updatedDetails });
      }
    }
    setIsThinking(false);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full bg-white rounded-lg shadow-xl", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 p-4 overflow-y-auto", children: [
      messages.map((msg, index) => /* @__PURE__ */ jsxDEV(Message, { msg }, index, false, {
        fileName: "<stdin>",
        lineNumber: 165,
        columnNumber: 47
      })),
      isThinking && /* @__PURE__ */ jsxDEV(Message, { msg: { sender: "ai", text: "\u601D\u8003\u4E2D..." } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 166,
        columnNumber: 32
      }),
      /* @__PURE__ */ jsxDEV("div", { ref: messagesEndRef }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 167,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 164,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "p-4 border-t border-gray-200", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          className: "flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: isThinking ? "\u8ACB\u7A0D\u5019..." : "\u8ACB\u8F38\u5165\u9810\u7D04\u5167\u5BB9...",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyPress: (e) => e.key === "Enter" && handleSend(),
          disabled: isThinking
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 171,
          columnNumber: 21
        }
      ),
      /* @__PURE__ */ jsxDEV("button", { onClick: handleSend, className: "px-4 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-400", disabled: isThinking || !input.trim(), children: /* @__PURE__ */ jsxDEV("i", { className: "fa-solid fa-paper-plane" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 181,
        columnNumber: 25
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 180,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 170,
      columnNumber: 17
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 169,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 163,
    columnNumber: 9
  });
};
export {
  ChatComponent
};
