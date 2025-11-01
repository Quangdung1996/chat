/**
 * Room Type Utility Functions
 * Helper functions for working with RocketChat room types
 */

import { 
  ROOM_TYPES, 
  ROOM_TYPE_LABELS, 
  ROOM_TYPE_ICONS, 
  ROOM_TYPE_API_NAMES,
  type RoomType,
  type RoomTypeApiName
} from '@/types/rocketchat';

/**
 * Check if room type is Direct Message
 */
export const isDirectMessage = (roomType: RoomType): boolean => {
  return roomType === ROOM_TYPES.DIRECT;
};

/**
 * Check if room type is Private Group
 */
export const isPrivateGroup = (roomType: RoomType): boolean => {
  return roomType === ROOM_TYPES.PRIVATE_GROUP;
};

/**
 * Check if room type is Public Channel
 */
export const isPublicChannel = (roomType: RoomType): boolean => {
  return roomType === ROOM_TYPES.PUBLIC_CHANNEL;
};

/**
 * Get display label for room type
 */
export const getRoomTypeLabel = (roomType: RoomType): string => {
  return ROOM_TYPE_LABELS[roomType] || 'Unknown';
};

/**
 * Get icon for room type
 */
export const getRoomTypeIcon = (roomType: RoomType): string => {
  return ROOM_TYPE_ICONS[roomType] || '📁';
};

/**
 * Get API name for room type (for backend calls)
 * Maps: 'd' -> 'direct', 'p' -> 'group', 'c' -> 'channel'
 */
export const getRoomTypeApiName = (roomType: RoomType): RoomTypeApiName => {
  const apiName = ROOM_TYPE_API_NAMES[roomType];
  return (apiName as RoomTypeApiName) || 'group';
};

/**
 * Get gradient background class for room type
 */
export const getRoomTypeGradient = (roomType: RoomType): string => {
  switch (roomType) {
    case ROOM_TYPES.DIRECT:
      return 'bg-gradient-to-br from-[#007aff] to-[#5856d6]';
    case ROOM_TYPES.PRIVATE_GROUP:
      return 'bg-gradient-to-br from-[#5856d6] to-[#af52de]';
    case ROOM_TYPES.PUBLIC_CHANNEL:
      return 'bg-gradient-to-br from-[#ff9500] to-[#ff2d55]';
    default:
      return 'bg-gradient-to-br from-gray-400 to-gray-600';
  }
};

/**
 * Check if room type supports multiple members
 * Direct messages don't have member management
 */
export const supportsMembers = (roomType: RoomType): boolean => {
  return roomType !== ROOM_TYPES.DIRECT;
};

/**
 * Validate if a string is a valid room type
 */
export const isValidRoomType = (type: string): type is RoomType => {
  return Object.values(ROOM_TYPES).includes(type as RoomType);
};

/**
 * Get room type from string with fallback
 */
export const parseRoomType = (type: string): RoomType | null => {
  return isValidRoomType(type) ? type : null;
};

