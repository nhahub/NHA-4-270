using System;
using System.Security.Cryptography;

namespace InventoryManagement.Service.Helpers
{
    public static class PasswordHasher
    {
        private const int SaltSize = 16; // 128 bit
        private const int KeySize = 32;  // 256 bit
        private const int Iterations = 10000;

        public static string HashPassword(string password)
        {
            var saltBytes = RandomNumberGenerator.GetBytes(SaltSize);
            var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
                password,
                saltBytes,
                Iterations,
                HashAlgorithmName.SHA256,
                KeySize);

            var key = Convert.ToBase64String(hashBytes);
            var salt = Convert.ToBase64String(saltBytes);

            return $"{Iterations}.{salt}.{key}";
        }

        public static bool VerifyPassword(string password, string hashedPassword)
        {
            var parts = hashedPassword.Split('.', 3);
            if (parts.Length != 3)
            {
                return false;
            }

            var iterations = int.Parse(parts[0]);
            var salt = Convert.FromBase64String(parts[1]);
            var key = Convert.FromBase64String(parts[2]);

            var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                KeySize);

            if (hashBytes.Length != key.Length) return false;
            for (int i = 0; i < key.Length; i++)
            {
                if (hashBytes[i] != key[i]) return false;
            }
            return true;
        }
    }
}
