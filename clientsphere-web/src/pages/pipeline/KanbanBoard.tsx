
import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import KanbanColumn     from './KanbanColumn'
import OpportunityCard  from './OpportunityCard'
import type {
  OpportunityResponse,
  OpportunityStage,
  KanbanColumnId,
} from '@/types/opportunity.types'
import {
  KANBAN_COLUMNS,
  STAGE_COLUMNS,
  COLUMN_TO_STAGE,
} from '@/types/opportunity.types'



interface KanbanBoardProps {
  opportunities:    OpportunityResponse[]
  onStageChange:    (id: string, stage: OpportunityStage) => Promise<void>
  onUpdateLocally:  (id: string, stage: OpportunityStage) => void
  onGenerateInvoice:(opportunity: OpportunityResponse) => void  // ← added
}

export default function KanbanBoard({
  opportunities,
  onStageChange,
  onUpdateLocally,
  onGenerateInvoice,
}: KanbanBoardProps) {
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [overId,    setOverId]    = useState<KanbanColumnId | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },  // prevent accidental drags on clicks
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Group opportunities by column
  const columnMap = useCallback(
    (columnId: KanbanColumnId): OpportunityResponse[] =>
      opportunities.filter(
        o => STAGE_COLUMNS[o.stage] === columnId
      ),
    [opportunities],
  )

  const activeOpportunity = activeId
    ? opportunities.find(o => o.id === activeId) ?? null
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id
    if (overId && KANBAN_COLUMNS.some(c => c.id === overId)) {
      setOverId(overId as KanbanColumnId)
    } else {
      setOverId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)

    if (!over) return

    const draggedId = active.id as string

    // Determine the target column — could be a column droppable or a card within a column
    let targetColumnId: KanbanColumnId | null = null

    if (KANBAN_COLUMNS.some(c => c.id === over.id)) {
      // Dropped directly onto a column
      targetColumnId = over.id as KanbanColumnId
    } else {
      // Dropped onto another card — find which column that card belongs to
      const targetCard = opportunities.find(o => o.id === over.id)
      if (targetCard) {
        targetColumnId = STAGE_COLUMNS[targetCard.stage]
      }
    }

    if (!targetColumnId) return

    const draggedCard  = opportunities.find(o => o.id === draggedId)
    if (!draggedCard)  return

    const currentColumnId = STAGE_COLUMNS[draggedCard.stage]
    if (currentColumnId === targetColumnId) return  // no change

    const newStage = COLUMN_TO_STAGE[targetColumnId]

    // Optimistic update — UI reflects change immediately
    onUpdateLocally(draggedId, newStage)

    // Persist to backend
    try {
      await onStageChange(draggedId, newStage)
    } catch {
      // Rollback optimistic update on failure
      onUpdateLocally(draggedId, draggedCard.stage)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={event => void handleDragEnd(event)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(column => (
          <div key={column.id} className="flex-shrink-0 w-56">
            <KanbanColumn
              id={column.id}
              label={column.label}
              opportunities={columnMap(column.id)}
              isOver={overId === column.id}
              onGenerateInvoice={onGenerateInvoice}
            />
          </div>
        ))}
      </div>

      {/* Drag overlay — floating card shown while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeOpportunity && (
          <div className="w-56 rotate-2 scale-105">
            <OpportunityCard
              opportunity={activeOpportunity}
              isDragging={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}