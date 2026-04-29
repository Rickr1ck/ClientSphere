using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Opportunities;
public sealed record OpportunityResponse(
    Guid Id,
    Guid TenantId,
    Guid CustomerId,
    Guid? LeadId,
    string Title,
    OpportunityStage Stage,
    decimal? EstimatedValue,
    int? Probability,
    DateOnly? ExpectedCloseDate,
    Guid OwnerId,
    Guid? ClosedByUserId,
    DateTimeOffset? ClosedAt,
    Guid? AssignedToId,
    Guid? PrimaryContactId,
    string? LossReason,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);