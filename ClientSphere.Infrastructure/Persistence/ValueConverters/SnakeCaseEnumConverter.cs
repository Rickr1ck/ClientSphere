using ClientSphere.Infrastructure.Common;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace ClientSphere.Infrastructure.Persistence.ValueConverters;

public sealed class SnakeCaseEnumConverter<TEnum> : ValueConverter<TEnum, string>
    where TEnum : struct, Enum
{
    public SnakeCaseEnumConverter()
        : base(
            value => EnumNaming.ToSnakeCase(value),
            value => EnumNaming.FromSnakeCase<TEnum>(value))
    {
    }
}
