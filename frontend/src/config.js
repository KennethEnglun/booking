/* 可預約的場地列表 */
export const AVAILABLE_VENUES = [
  '101', '102', '103', '104', 
  '201', '202', '203', '204', 
  '301', '302', '303', '304', 
  'STEM Room', '音樂室', '活動室', '英語室', 
  '圖書館', '煮角', 'G01電競室', '輔導室', 
  'G02', 'G03', '禮堂', '操場', '壁球室', '攀石牆'
];

/* 成功訊息顯示時間（毫秒） */
export const SUCCESS_MSG_VISIBILITY_DURATION = 3000;

/* API 基礎 URL */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://booking-production-fcea.up.railway.app/api'; 