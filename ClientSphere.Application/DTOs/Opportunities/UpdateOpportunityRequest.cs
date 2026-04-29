using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Opportunities;
public sealed record UpdateOpportunityRequest(
    string Title,
    OpportunityStage Stage,
    decimal? EstimatedValue,
    int? Probability,
    DateOnly? ExpectedCloseDate,
    Guid? AssignedToId,
    Guid? PrimaryContactId,
    string? LossReason,
    string? Notes
);