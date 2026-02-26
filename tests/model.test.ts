import { describe, it, expect, beforeEach } from "bun:test";
import * as TaskModel from "../src/models/task";

describe("Task Model", () => {
  beforeEach(() => {
    TaskModel.reset();
  });

  it("starts with empty task list", () => {
    expect(TaskModel.list()).toEqual([]);
  });

  it("creates a task with defaults", () => {
    const task = TaskModel.create({ title: "Test task" });
    expect(task.title).toBe("Test task");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
    expect(task.description).toBe("");
    expect(task.id).toBeTruthy();
    expect(task.createdAt).toBeTruthy();
    expect(task.dueDate).toBeUndefined();
  });

  it("creates a task with a dueDate", () => {
    const task = TaskModel.create({ title: "Due soon", dueDate: "2026-03-01" });
    expect(task.dueDate).toBe("2026-03-01");
  });

  it("updates a task's dueDate", () => {
    const task = TaskModel.create({ title: "Has due date" });
    const updated = TaskModel.update(task.id, { dueDate: "2026-04-15" });
    expect(updated.dueDate).toBe("2026-04-15");
  });

  it("creates tasks with incrementing IDs", () => {
    const a = TaskModel.create({ title: "A" });
    const b = TaskModel.create({ title: "B" });
    expect(b.id).toBe(a.id + 1);
  });

  it("lists all tasks", () => {
    TaskModel.create({ title: "A" });
    TaskModel.create({ title: "B" });
    TaskModel.create({ title: "C" });
    expect(TaskModel.list()).toHaveLength(3);
  });

  it("filters tasks by status", () => {
    TaskModel.create({ title: "A" });
    const b = TaskModel.create({ title: "B" });
    TaskModel.update(b.id, { status: "done" });
    expect(TaskModel.list("todo")).toHaveLength(1);
    expect(TaskModel.list("done")).toHaveLength(1);
  });

  it("gets a task by ID", () => {
    const created = TaskModel.create({ title: "Find me" });
    const found = TaskModel.get(created.id);
    expect(found.title).toBe("Find me");
  });

  it("throws NotFoundError for missing task", () => {
    expect(() => TaskModel.get(999)).toThrow("Task not found");
  });

  it("updates a task", () => {
    const task = TaskModel.create({ title: "Original" });
    const updated = TaskModel.update(task.id, {
      title: "Updated",
      status: "in_progress",
    });
    expect(updated.title).toBe("Updated");
    expect(updated.status).toBe("in_progress");
  });

  it("deletes a task", () => {
    const task = TaskModel.create({ title: "Delete me" });
    TaskModel.remove(task.id);
    expect(TaskModel.list()).toHaveLength(0);
  });

  it("returns correct stats", () => {
    TaskModel.create({ title: "A" });
    TaskModel.create({ title: "B" });
    const c = TaskModel.create({ title: "C" });
    TaskModel.update(c.id, { status: "done" });

    const s = TaskModel.stats();
    expect(s.total).toBe(3);
    expect(s.todo).toBe(2);
    expect(s.done).toBe(1);
    expect(s.in_progress).toBe(0);
  });
});
