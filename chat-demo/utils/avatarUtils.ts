/**
 * Avatar Utility Functions
 * Centralized avatar helpers to avoid code duplication
 */

/**
 * Get initials from a name (first letter of first and last word)
 * @param name Full name or username
 * @param maxLength Maximum length of initials (default: 2)
 * @returns Uppercase initials (e.g., "Nguyễn Văn A" -> "NA")
 */
export function getInitials(name?: string, maxLength: number = 2): string {
  if (!name) return '??';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length >= 2) {
    // Lấy chữ cái đầu của từ đầu tiên và từ cuối cùng
    return (words[0][0] + words[words.length - 1][0])
      .toUpperCase()
      .slice(0, maxLength);
  }
  
  // Nếu chỉ có 1 từ, lấy 2 ký tự đầu
  return name.slice(0, maxLength).toUpperCase();
}

/**
 * Get avatar color gradient class based on name/username
 * Uses consistent color palette for consistent avatar colors
 * @param name Name or username to generate color from
 * @returns Tailwind gradient class string
 */
export function getAvatarColor(name?: string): string {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
  ];
  
  if (!name) return colors[0];
  
  // Use first character to determine color (consistent for same name)
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/**
 * Get avatar color gradient class (alternative style - Apple style)
 * Uses different color palette for Apple-style UI
 * @param username Username to generate color from
 * @returns Tailwind gradient class string
 */
export function getAvatarColorApple(username?: string): string {
  const colors = [
    'from-[#007aff] to-[#0051d5]',
    'from-[#5856d6] to-[#3634a3]',
    'from-[#ff2d55] to-[#c7254e]',
    'from-[#34c759] to-[#248a3d]',
    'from-[#ff9500] to-[#c93400]',
    'from-[#af52de] to-[#8e24aa]',
  ];
  
  if (!username) return `bg-gradient-to-br ${colors[0]}`;
  
  const index = username.charCodeAt(0) % colors.length;
  return `bg-gradient-to-br ${colors[index]}`;
}

