using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace SourceAPI.Helpers.RocketChat
{
    public static class PasswordGenerator
    {
        private const string UppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string LowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        private const string DigitChars = "0123456789";
        private const string SpecialChars = "!@#$%^&*()-_=+[]{}|;:,.<>?";

        public static string GenerateStrongPassword(int length = 16)
        {
            if (length < 12)
            {
                throw new ArgumentException("Password length must be at least 12 characters", nameof(length));
            }

            var password = new StringBuilder();
            var allChars = UppercaseChars + LowercaseChars + DigitChars + SpecialChars;

            // Ensure at least one character from each category
            password.Append(GetRandomChar(UppercaseChars));
            password.Append(GetRandomChar(LowercaseChars));
            password.Append(GetRandomChar(DigitChars));
            password.Append(GetRandomChar(SpecialChars));

            // Fill the rest with random characters
            for (int i = 4; i < length; i++)
            {
                password.Append(GetRandomChar(allChars));
            }

            // Shuffle the password
            return Shuffle(password.ToString());
        }

        public static string GenerateMemorablePassword()
        {
            var words = new[]
            {
                "Red", "Blue", "Green", "Yellow", "Purple", "Orange",
                "Sky", "Cloud", "Rain", "Sun", "Moon", "Star",
                "Tree", "Leaf", "Flower", "River", "Ocean", "Mountain"
            };

            var word1 = words[RandomNumberGenerator.GetInt32(words.Length)];
            var word2 = words[RandomNumberGenerator.GetInt32(words.Length)];
            var number = RandomNumberGenerator.GetInt32(1000, 9999);
            var special = GetRandomChar(SpecialChars);

            return $"{word1}-{word2}-{number}-{special}";
        }

        public static bool IsStrongPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 12)
                return false;

            var hasUpper = password.Any(char.IsUpper);
            var hasLower = password.Any(char.IsLower);
            var hasDigit = password.Any(char.IsDigit);
            var hasSpecial = password.Any(c => SpecialChars.Contains(c));

            return hasUpper && hasLower && hasDigit && hasSpecial;
        }

        private static char GetRandomChar(string chars)
        {
            var index = RandomNumberGenerator.GetInt32(chars.Length);
            return chars[index];
        }

        private static string Shuffle(string input)
        {
            var array = input.ToCharArray();
            int n = array.Length;

            for (int i = n - 1; i > 0; i--)
            {
                int j = RandomNumberGenerator.GetInt32(i + 1);
                // Swap
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }

            return new string(array);
        }
    }
}

