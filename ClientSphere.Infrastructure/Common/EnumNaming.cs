using System.Text.RegularExpressions;

namespace ClientSphere.Infrastructure.Common;

internal static partial class EnumNaming
{
    public static string ToSnakeCase(Enum value) =>
        SplitPascalCase().Replace(value.ToString(), "_$1").TrimStart('_').ToLowerInvariant();

    public static TEnum FromSnakeCase<TEnum>(string value)
        where TEnum : struct, Enum
    {
        var pascalCase = string.Concat(
            value.Split('_', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(segment => segment.Length == 1
                    ? char.ToUpperInvariant(segment[0]).ToString()
                    : char.ToUpperInvariant(segment[0]) + segment[1..]));

        return Enum.Parse<TEnum>(pascalCase, ignoreCase: false);
    }

    private static Regex SplitPascalCase() =>
        new Regex("(?<!^)([A-Z])", RegexOptions.Compiled);
}
