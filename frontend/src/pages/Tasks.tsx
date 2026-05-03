import React, { useEffect, useMemo, useState } from "react";
import { listProjects } from "../api/projects";
import { createTask, listProjectTasks, updateTaskStatus } from "../api/tasks";
import {
  TaskPriority,
  type Project,
  type Task,
  type TaskStatus,
} from "../types";
import Button from "../components/Button";
import Input from "../components/Input";
import KanbanBoard from "../components/KanbanBoard";
import TaskDetailPanel from "../components/TaskDetailPanel";

export default function Tasks() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      void loadTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function loadProjects() {
    try {
      const response = await listProjects();
      setProjects(response);
      setSelectedProjectId((current) => current || response[0]?.id || "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load projects",
      );
    }
  }

  async function loadTasks(projectId: string) {
    try {
      const response = await listProjectTasks(projectId);
      setTasks(response);
      setSelectedTask((current) => current ?? response[0] ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load tasks",
      );
    }
  }

  async function handleCreateTask(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProjectId) return;

    await createTask({
      projectId: selectedProjectId,
      title,
      description: description || undefined,
      dueDate: dueDate || undefined,
      priority,
      assigneeId: assigneeId || undefined,
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setAssigneeId("");
    await loadTasks(selectedProjectId);
  }

  async function moveTask(taskId: string, nextStatus: TaskStatus) {
    const updatedTask = await updateTaskStatus(taskId, { status: nextStatus });
    setTasks((current) =>
      current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setSelectedTask(updatedTask);
  }

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>
            Move work through a Kanban board and inspect the full task detail
            panel.
          </p>
        </div>
      </div>

      <div className="page-grid page-grid--tasks">
        <section className="card">
          <h2>Create task</h2>
          <form className="form" onSubmit={handleCreateTask}>
            <select
              className="input"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
            <select
              className="input"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TaskPriority)
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <select
              className="input"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {selectedProject?.team?.members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
            <Button type="submit">Create task</Button>
          </form>

          <div className="task-board-summary">
            <strong>
              {selectedProject ? selectedProject.name : "No project selected"}
            </strong>
            <span>{tasks.length} tasks loaded</span>
          </div>
          {error ? <p className="form__error">{error}</p> : null}
        </section>

        <section className="card card--full">
          <KanbanBoard
            tasks={tasks}
            selectedTaskId={selectedTask?.id ?? null}
            onTaskSelect={setSelectedTask}
            onMoveTask={moveTask}
          />
        </section>

        <TaskDetailPanel task={selectedTask} onMoveTask={moveTask} />
      </div>
    </div>
  );
}
