'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Stop } from '@/lib/types';
import StopCard from './StopCard';

interface Props {
  stops: Stop[];
  dayId: string;
  onStopClick: (stop: Stop) => void;
  onReorder: (dayId: string, stops: Stop[]) => void;
}

export default function StopList({
  stops,
  dayId,
  onStopClick,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stops.findIndex((s) => s.id === active.id);
    const newIndex = stops.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(stops, oldIndex, newIndex);
    onReorder(dayId, reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={stops.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-3 space-y-2">
          {stops.map((stop, index) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={index}
              onClick={() => onStopClick(stop)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}