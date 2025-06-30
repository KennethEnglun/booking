import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          場地預約系統
        </h1>
        <p className="text-gray-600 mb-6">
          系統正在運行中...
        </p>
        <div className="space-y-4">
          <button
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            點擊測試: {count}
          </button>
          <div className="text-sm text-gray-500">
            如果這個按鈕可以點擊，說明 React 正常運行
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">系統狀態：</h3>
          <ul className="text-sm text-left space-y-1">
            <li>✅ React 組件載入</li>
            <li>✅ Tailwind CSS 樣式</li>
            <li>✅ 狀態管理</li>
            <li>⏳ 等待 API 連接...</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App; 