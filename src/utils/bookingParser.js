import dayjs from 'dayjs';
import { AVAILABLE_VENUES } from '../config.js';

/**
 * Parses natural language input to extract booking details.
 * @param {string} text - The user's input string.
 * @returns {object|null} - An object with booking details or null if parsing fails.
 */
export const parseBookingRequest = (text) => {
    // Venue
    const venueMatch = AVAILABLE_VENUES.find(v => text.includes(v));
    
    // Date
    let date = dayjs();
    let dateFound = false;
    if (text.includes('聽日') || text.includes('明天')) {
        date = dayjs().add(1, 'day');
        dateFound = true;
    } else if (text.includes('後天')) {
        date = dayjs().add(2, 'day');
        dateFound = true;
    } else {
        const dateRegex = /(\d{1,2})月(\d{1,2})日/;
        const dateMatch = text.match(dateRegex);
        if (dateMatch) {
            date = dayjs(`${dayjs().year()}-${dateMatch[1]}-${dateMatch[2]}`);
            dateFound = true;
        }
    }

    // Time
    const timeRegex = /(?:上(?:午|晝)|早[上下])?(\d{1,2})[點時](?:(\d{1,2})分)?\s*(?:到|至)\s*(?:下(?:午|晝))?(\d{1,2})[點時](?:(\d{1,2})分)?/;
    const timeMatch = text.match(timeRegex);
    
    let startTime, endTime;
    if (timeMatch) {
        let [, startHourStr, startMinuteStr, endHourStr, endMinuteStr] = timeMatch;
        let startHour = parseInt(startHourStr, 10);
        let startMinute = parseInt(startMinuteStr, 10) || 0;
        let endHour = parseInt(endHourStr, 10);
        let endMinute = parseInt(endMinuteStr, 10) || 0;

        // Handle AM/PM logic more robustly, especially for "下午" (afternoon)
        if (text.includes('下午') || text.includes('夜晚')) {
            if (startHour >= 1 && startHour < 12) startHour += 12;
            if (endHour >= 1 && endHour < 12) endHour += 12;
        }

        // If end hour is earlier than start hour, assume it's on the next 12-hour block (e.g. 10 to 1 -> 10 to 13)
        // This is a common pattern in spoken language.
        if (endHour < startHour) endHour += 12;
        
        startTime = dayjs(date).hour(startHour).minute(startMinute);
        endTime = dayjs(date).hour(endHour).minute(endMinute);
    }


    // Purpose
    let purpose = "未提供";
    const purposeKeywords = ['用嚟', '用黎', '用於', '作', '開會', '活動', '講座', '演講'];
    const keywordIndex = purposeKeywords.reduce((acc, curr) => {
        const index = text.indexOf(curr);
        return (index !== -1 && (acc === -1 || index < acc)) ? index : acc;
    }, -1);
    
    if (keywordIndex !== -1) {
        purpose = text.substring(keywordIndex).replace(/^[用嚟黎於作\s]+/, '').trim();
    } else if (text.includes('開會')) {
        purpose = '會議';
    }

    if (!venueMatch && !startTime && !dateFound) return null;

    return {
        venue: venueMatch || null,
        booking_date: startTime ? startTime.format('YYYY-MM-DD') : (dateFound ? date.format('YYYY-MM-DD') : null),
        start_time: startTime ? startTime.format('HH:mm') : null,
        end_time: endTime ? endTime.format('HH:mm') : null,
        purpose: purpose,
    };
};