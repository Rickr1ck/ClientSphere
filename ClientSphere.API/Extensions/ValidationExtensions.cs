using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Extensions;

public static class ValidationExtensions
{
    public static ValidationProblemDetails ToValidationProblemDetails(this ValidationResult result)
    {
        var errors = result.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray());

        return new ValidationProblemDetails(errors)
        {
            Title = "One or more validation errors occurred.",
            Status = StatusCodes.Status400BadRequest
        };
    }
}
