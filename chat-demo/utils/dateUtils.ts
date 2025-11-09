/**
 * Date and Time Utility Functions
 * Centralized date/time formatting to avoid code duplication
 */

/**
 * Parse Rocket.Chat timestamp format to ISO string
 * Handles multiple formats: string, number, $date object
 */
export function parseTimestamp(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts.$date) return new Date(ts.$date).toISOString();
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return new Date().toISOString();
}

/**
 * Format timestamp for display in messages
 * Shows time if within 24 hours, otherwise shows date + time
 * @param timestamp ISO string or Rocket.Chat timestamp
 * @param locale Locale string (default: 'vi-VN')
 */
export function formatMessageTime(timestamp?: string, locale: string = 'vi-VN'): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  const diffInMinutes = diffInSeconds / 60;
  const diffInHours = diffInMinutes / 60;

  // Tin nhắn trong vòng 24 giờ - chỉ hiển thị giờ
  if (diffInHours < 24) {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Tin nhắn cũ hơn 24 giờ - hiển thị ngày + giờ
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

