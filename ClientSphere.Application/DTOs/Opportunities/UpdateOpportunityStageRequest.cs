using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Opportunities;
// Dedicated Kanban patch DTO — only the stage field
public sealed record UpdateOpportunityStageRequest(
    OpportunityStage Stage
);