using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Opportunities;
public sealed record CreateOpportunityRequest(
    Guid CustomerId,
    Guid? LeadId,
    string Title,
    OpportunityStage Stage,
    decimal? EstimatedValue,
    int? Probability,
    DateOnly? ExpectedCloseDate,
    Guid? AssignedToId,
    Guid? PrimaryContactId,
    string? Notes
);