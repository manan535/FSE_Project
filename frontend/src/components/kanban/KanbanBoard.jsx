import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import useTaskStore from '../../store/taskStore';

const COLUMNS = ['todo', 'in_progress', 'done'];

const KanbanBoard = () => {
  const { tasks, moveTask, getColumns } = useTaskStore();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const columns = getColumns();

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Determine the target column
    let targetStatus;

    if (COLUMNS.includes(over.id)) {
      // Dropped directly on a column
      targetStatus = over.id;
    } else {
      // Dropped on another task — get that task's column
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      } else {
        return;
      }
    }

    // Only update if status changed
    if (task.status === targetStatus) return;

    // Forward-only movement: todo → in_progress → done
    const statusOrder = { todo: 0, in_progress: 1, done: 2 };
    const currentOrder = statusOrder[task.status];
    const targetOrder = statusOrder[targetStatus];

    if (targetOrder <= currentOrder) {
      // Cannot move backward
      return;
    }

    // Calculate position: place at end of target column
    const targetTasks = columns[targetStatus] || [];
    const lastPosition = targetTasks.length > 0 ? Math.max(...targetTasks.map((t) => t.position)) : 0;
    const newPosition = lastPosition + 1000;

    moveTask(taskId, targetStatus, newPosition);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {COLUMNS.map((status, index) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <KanbanColumn status={status} tasks={columns[status] || []} />
          </motion.div>
        ))}
      </motion.div>

      {/* Drag Overlay — renders floating card while dragging */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask ? (
          <div className="rotate-[3deg] scale-105 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
