import { NotFoundError } from "../utils/errors";

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in_progress" | "done";
  createdAt: string;
  updatedAt: string;
}

let tasks = new Map<number, Task>();
let nextId = 1;

export function reset() {
  tasks = new Map();
  nextId = 1;
}

export function list(status?: string): Task[] {
  const all = Array.from(tasks.values());
  if (status) return all.filter((t) => t.status === status);
  return all;
}

export function get(id: number | string): Task {
  const task = tasks.get(Number(id));
  if (!task) throw new NotFoundError("Task");
  return task;
}

export function create(data: {
  title: string;
  description?: string;
  priority?: Task["priority"];
}): Task {
  const task: Task = {
    id: nextId++,
    title: data.title,
    description: data.description ?? "",
    priority: data.priority ?? "medium",
    status: "todo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  return task;
}

export function update(
  id: number | string,
  fields: Partial<Pick<Task, "title" | "description" | "priority" | "status">>,
): Task {
  const task = get(id);
  const allowed = ["title", "description", "priority", "status"] as const;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      (task as any)[key] = fields[key];
    }
  }
  task.updatedAt = new Date().toISOString();
  tasks.set(task.id, task);
  return task;
}

export function remove(id: number | string): Task {
  const task = get(id);
  tasks.delete(Number(id));
  return task;
}

export function stats() {
  const all = Array.from(tasks.values());
  return {
    total: all.length,
    todo: all.filter((t) => t.status === "todo").length,
    in_progress: all.filter((t) => t.status === "in_progress").length,
    done: all.filter((t) => t.status === "done").length,
  };
}
