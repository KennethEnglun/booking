import React, { useState, useEffect, useRef } from "react";
import { bookingAPI, userAPI } from "../utils/api.js";
import { parseBookingRequest } from "../utils/bookingParser.js";
import { AVAILABLE_VENUES } from "../config.js";

const Message = ({ msg }) => {
  const isUser = msg.sender === "user";
  const bubbleClass = isUser ? "chat-bubble user" : "chat-bubble ai";
  const avatarUrl = isUser && msg.avatar ? msg.avatar : "https://images.websim.com/avatar/websim-assistant";
  
  return (
    <div className={`flex items-end gap-2 my-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />
      <div className={bubbleClass}>{msg.text}</div>
    </div>
  );
};

const ChatComponent = () => {
  const [messages, setMessages] = useState([
    { 
      sender: "ai", 
      text: `你好！請問想預約邊個場地同時間？我可以幫你處理。例如：「我想預約聽日下晝2點到4點嘅會議室 A 開會」` 
    }
  ]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [isThinking, setIsThinking] = useState(false);
  const [bookingState, setBookingState] = useState({
    stage: "idle", // idle, awaiting_venue, awaiting_date, awaiting_time, confirming
    details: {}
  });

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const addMessage = (sender, text, avatar = null) => {
    setMessages((prev) => [...prev, { sender, text, avatar }]);
  };

  const processBookingLogic = async (bookingDetails) => {
    setIsThinking(true);
    addMessage("ai", `收到！正在為你查詢 ${bookingDetails.booking_date} ${bookingDetails.start_time}-${bookingDetails.end_time} 嘅「${bookingDetails.venue}」...`);
    
    const aiThinkingDelay = 500;
    await new Promise((resolve) => setTimeout(resolve, aiThinkingDelay));

    try {
      // 檢查時間衝突
      const conflictCheck = await bookingAPI.checkConflict(
        bookingDetails.venue, 
        bookingDetails.booking_date, 
        bookingDetails.start_time, 
        bookingDetails.end_time
      );

      if (conflictCheck.hasConflict) {
        addMessage("ai", `抱歉，${bookingDetails.venue} 喺 ${bookingDetails.booking_date} ${bookingDetails.start_time}-${bookingDetails.end_time} 已經被預約。請選擇其他時間。`);
        setBookingState({ stage: "idle", details: {} });
      } else {
        // 創建預約
        await bookingAPI.create({
          ...bookingDetails,
          purpose: bookingDetails.purpose || "未提供",
          user_id: currentUser.id
        });
        
        addMessage("ai", `✅ 預約成功！
場地: ${bookingDetails.venue}
日期: ${bookingDetails.booking_date}
時間: ${bookingDetails.start_time} - ${bookingDetails.end_time}
用途: ${bookingDetails.purpose || "未提供"}`);
        setBookingState({ stage: "idle", details: {} });
      }
    } catch (error) {
      console.error("預約失敗:", error);
      addMessage("ai", "系統發生錯誤，預約失敗，請稍後再試。");
      setBookingState({ stage: "idle", details: {} });
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
          addMessage("ai", `好嘅，預約 ${venueMatch}。請問係邊一日？ (例如: 聽日, 12月25日)`);
        } else {
          addMessage("ai", `唔好意思，我地只有以下場地：${AVAILABLE_VENUES.join(", ")}。請再選擇一次。`);
        }
      } else if (bookingState.stage === "awaiting_date") {
        const parsed = parseBookingRequest(userMessage);
        if (parsed && parsed.booking_date) {
          details.booking_date = parsed.booking_date;
          nextStage = "awaiting_time";
          addMessage("ai", `收到，日期係 ${details.booking_date}。請問係幾點到幾點？ (例如: 下晝2點到4點)`);
        } else {
          addMessage("ai", "抱歉，未能識別日期，請用「X月X日」或「聽日」等格式再試一次。");
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
          addMessage("ai", "抱歉，未能識別時間，請用「X點到Y點」格式再試一次。");
        }
      }
      
      setBookingState({ stage: nextStage, details });
    } else {
      const parsedDetails = parseBookingRequest(userMessage);
      if (parsedDetails && parsedDetails.venue && parsedDetails.booking_date && parsedDetails.start_time) {
        const fullDetails = {
          ...parsedDetails,
          person_in_charge: currentUser.username
        };
        await processBookingLogic(fullDetails);
      } else {
        let updatedDetails = parsedDetails || {};
        let nextStage = "idle";
        
        if (!updatedDetails.venue) {
          nextStage = "awaiting_venue";
          addMessage("ai", `收到！請問你想預約邊個場地？我地有：${AVAILABLE_VENUES.join("、")}`);
        } else if (!updatedDetails.booking_date) {
          nextStage = "awaiting_date";
          addMessage("ai", `好嘅，預約 ${updatedDetails.venue}。請問係邊一日？ (例如: 聽日, 12月25日)`);
        } else if (!updatedDetails.start_time) {
          nextStage = "awaiting_time";
          addMessage("ai", `收到，日期係 ${updatedDetails.booking_date}。請問係幾點到幾點？ (例如: 下晝2點到4點)`);
        }
        
        setBookingState({ stage: nextStage, details: updatedDetails });
      }
    }
    
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <Message key={index} msg={msg} />
        ))}
        {isThinking && (
          <Message msg={{ sender: "ai", text: "思考中..." }} />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={isThinking ? "請稍候..." : "請輸入預約內容..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-400"
            disabled={isThinking || !input.trim()}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export { ChatComponent }; 