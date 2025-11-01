namespace SourceAPI.Helpers.RocketChat
{
    public static class RocketChatMemberAction
    {
        public static bool IsInvite(this string action)
        {
            return action?.ToLower() == "invite";
        }

        public static bool IsKick(this string action)
        {
            return action?.ToLower() == "kick" || action?.ToLower() == "remove";
        }

        public static bool IsAddModerator(this string action)
        {
            return action?.ToLower() == "addmoderator";
        }

        public static bool IsRemoveModerator(this string action)
        {
            return action?.ToLower() == "removemoderator";
        }

        public static bool IsAddOwner(this string action)
        {
            return action?.ToLower() == "addowner";
        }

        public static bool IsRemoveOwner(this string action)
        {
            return action?.ToLower() == "removeowner";
        }
    }
}

