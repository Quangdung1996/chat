using System;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace SourceAPI.Helpers.RocketChat
{
    /// <summary>
    /// T-09, T-15: Helper for generating slugs and room names
    /// </summary>
    public static class SlugHelper
    {
        /// <summary>
        /// Convert Vietnamese text to slug (non-diacritics, lowercase, hyphen separated)
        /// </summary>
        public static string ToSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Remove diacritics (Vietnamese accents)
            text = RemoveDiacritics(text);

            // Convert to lowercase
            text = text.ToLowerInvariant();

            // Replace spaces and special characters with hyphen
            text = Regex.Replace(text, @"[^a-z0-9\-]", "-");

            // Replace multiple hyphens with single hyphen
            text = Regex.Replace(text, @"-+", "-");

            // Remove leading/trailing hyphens
            text = text.Trim('-');

            return text;
        }

        /// <summary>
        /// Remove Vietnamese diacritics
        /// </summary>
        private static string RemoveDiacritics(string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder
                .ToString()
                .Normalize(NormalizationForm.FormC)
                .Replace("đ", "d")
                .Replace("Đ", "D");
        }

        /// <summary>
        /// Generate unique username from full name
        /// T-09: Username unique (slug + số); retry khi trùng
        /// </summary>
        public static string GenerateUsername(string fullName, int? suffix = null)
        {
            var slug = ToSlug(fullName);

            // Limit length to 50 characters
            if (slug.Length > 50)
            {
                slug = slug.Substring(0, 50);
            }

            if (suffix.HasValue)
            {
                return $"{slug}-{suffix.Value}";
            }

            return slug;
        }

        /// <summary>
        /// Generate room name based on convention: {PhongBan}-{DuAn}-{HauTo}
        /// T-15: Quy ước tên phòng
        /// </summary>
        public static string GenerateRoomName(string department, string project, string? suffix = null)
        {
            var deptSlug = ToSlug(department);
            var projSlug = ToSlug(project);

            var roomName = $"{deptSlug}-{projSlug}";

            if (!string.IsNullOrWhiteSpace(suffix))
            {
                roomName += $"-{ToSlug(suffix)}";
            }

            // Validate length (Rocket.Chat has limits)
            if (roomName.Length > 100)
            {
                // Truncate intelligently
                var maxDeptLen = 30;
                var maxProjLen = 30;
                var maxSuffixLen = 30;

                deptSlug = deptSlug.Length > maxDeptLen ? deptSlug.Substring(0, maxDeptLen) : deptSlug;
                projSlug = projSlug.Length > maxProjLen ? projSlug.Substring(0, maxProjLen) : projSlug;

                roomName = $"{deptSlug}-{projSlug}";
                if (!string.IsNullOrWhiteSpace(suffix))
                {
                    var suffixSlug = ToSlug(suffix);
                    suffixSlug = suffixSlug.Length > maxSuffixLen ? suffixSlug.Substring(0, maxSuffixLen) : suffixSlug;
                    roomName += $"-{suffixSlug}";
                }
            }

            return roomName;
        }

        /// <summary>
        /// Validate room name
        /// </summary>
        public static bool IsValidRoomName(string roomName)
        {
            if (string.IsNullOrWhiteSpace(roomName))
                return false;

            if (roomName.Length > 100)
                return false;

            // Only lowercase, numbers, and hyphens
            return Regex.IsMatch(roomName, @"^[a-z0-9\-]+$");
        }
    }
}

