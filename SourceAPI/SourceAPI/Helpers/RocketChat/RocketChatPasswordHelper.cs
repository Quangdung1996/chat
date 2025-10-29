using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace SourceAPI.Helpers.RocketChat
{
    /// <summary>
    /// Helper for generating passwords for Rocket.Chat users
    /// Passwords are deterministically hashed from userId + salt for reproducibility
    /// </summary>
    public static class RocketChatPasswordHelper
    {
        // Salt secret - should be stored in appsettings.json or environment variable
        // Hardcoded for demo purposes only
        private const string SALT_SECRET = "RocketChat@2025!SecretSalt#XYZ";

        /// <summary>
        /// Generate deterministic password from userId + salt
        /// Same userId will always produce the same password
        /// </summary>
        /// <param name="userId">Internal user ID</param>
        /// <returns>Hashed password (24 chars, alphanumeric + special chars)</returns>
        public static string GeneratePasswordFromUserId(int userId)
        {
            // Combine userId + salt
            string rawInput = $"{userId}|{SALT_SECRET}";

            // Hash using SHA256
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawInput));
                
                // Convert to Base64
                string base64Hash = Convert.ToBase64String(hashBytes);
                
                // Take first 20 chars and add special chars for complexity
                // Rocket.Chat requires complex passwords (uppercase, lowercase, numbers, special chars)
                string password = base64Hash.Substring(0, 20) + "!@#$";
                
                return password;
            }
        }

        /// <summary>
        /// Generate deterministic password from username + salt
        /// Same username will always produce the same password
        /// Use when userId is not available
        /// </summary>
        /// <param name="username">Username</param>
        /// <returns>Hashed password (24 chars, alphanumeric + special chars)</returns>
        public static string GeneratePasswordFromUsername(string username)
        {
            // Combine username + salt
            string rawInput = $"{username}|{SALT_SECRET}";

            // Hash using SHA256
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawInput));
                
                // Convert to Base64
                string base64Hash = Convert.ToBase64String(hashBytes);
                
                // Take first 20 chars and add special chars for complexity
                string password = base64Hash.Substring(0, 20) + "!@#$";
                
                return password;
            }
        }

        /// <summary>
        /// Generate password from userId + custom salt
        /// </summary>
        public static string GeneratePasswordFromUserId(int userId, string customSalt)
        {
            string rawInput = $"{userId}|{customSalt}";

            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawInput));
                string base64Hash = Convert.ToBase64String(hashBytes);
                string password = base64Hash.Substring(0, 20) + "!@#$";
                
                return password;
            }
        }

        /// <summary>
        /// Verify password by recalculating from userId
        /// </summary>
        public static bool VerifyPassword(int userId, string password)
        {
            string expectedPassword = GeneratePasswordFromUserId(userId);
            return expectedPassword == password;
        }

        /// <summary>
        /// Generate random strong password (for admin or special cases)
        /// </summary>
        public static string GenerateRandomStrongPassword(int length = 24)
        {
            const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
            StringBuilder result = new StringBuilder();
            
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] randomBytes = new byte[length];
                rng.GetBytes(randomBytes);
                
                foreach (byte b in randomBytes)
                {
                    result.Append(validChars[b % validChars.Length]);
                }
            }
            
            // Ensure at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
            string password = result.ToString();
            password = EnsurePasswordComplexity(password);
            
            return password;
        }

        /// <summary>
        /// Ensure password meets complexity requirements
        /// </summary>
        private static string EnsurePasswordComplexity(string password)
        {
            char[] chars = password.ToCharArray();
            
            // Ensure uppercase letter exists
            if (!password.Any(char.IsUpper))
                chars[0] = 'A';
            
            // Ensure lowercase letter exists
            if (!password.Any(char.IsLower))
                chars[1] = 'a';
            
            // Ensure digit exists
            if (!password.Any(char.IsDigit))
                chars[2] = '1';
            
            // Ensure special character exists
            if (!password.Any(c => "!@#$%^&*".Contains(c)))
                chars[3] = '!';
            
            return new string(chars);
        }
    }
}

