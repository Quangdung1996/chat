namespace SourceAPI.Extensions
{
    public static class RocketChatRoomTypeExtensions
    {
        public static bool IsGroup(this string roomType)
        {
            return roomType?.ToLower() == "group" || roomType?.ToLower() == "p";
        }

        public static bool IsChannel(this string roomType)
        {
            return roomType?.ToLower() == "channel" || roomType?.ToLower() == "c";
        }

        public static bool IsDirect(this string roomType)
        {
            return roomType?.ToLower() == "dm" || 
                   roomType?.ToLower() == "d" || 
                   roomType?.ToLower() == "direct";
        }

        public static string Normalize(this string roomType)
        {
            if (roomType.IsGroup()) return "group";
            if (roomType.IsChannel()) return "channel";
            if (roomType.IsDirect()) return "direct";
            return roomType?.ToLower() ?? "unknown";
        }
    }
}

