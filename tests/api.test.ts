import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import * as TaskModel from "../src/models/task";

const BASE = "http://localhost:3001";
let server: any;

// Start a test server on a different port
beforeEach(() => {
  TaskModel.reset();
});

// Start server before tests
server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const { AppError, ValidationError } = await import("../src/utils/errors");
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method;

    try {
      if (pathname === "/health" && method === "GET") {
        return Response.json({
          status: "ok",
          uptime: Math.round(process.uptime()),
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        });
      }

      let body: any = {};
      if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
          body = await req.json();
        } catch {
          throw new AppError("Invalid JSON", 400);
        }
      }

      if (pathname === "/api/tasks" && method === "GET") {
        const status = url.searchParams.get("status") || undefined;
        const tasks = TaskModel.list(status);
        return Response.json({ data: tasks, count: tasks.length });
      }

      if (pathname === "/api/tasks" && method === "POST") {
        if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
          throw new ValidationError("title is required");
        }
        const task = TaskModel.create(body);
        return Response.json({ data: task }, { status: 201 });
      }

      if (pathname === "/api/stats" && method === "GET") {
        return Response.json({ data: TaskModel.stats() });
      }

      const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
      if (taskMatch) {
        const id = taskMatch[1];
        if (method === "GET") return Response.json({ data: TaskModel.get(id) });
        if (method === "PUT") return Response.json({ data: TaskModel.update(id, body) });
        if (method === "DELETE") return Response.json({ data: TaskModel.remove(id), message: "Task deleted" });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return Response.json({ error: err.message }, { status });
    }
  },
});

afterAll(() => {
  server.stop();
});

describe("Health API", () => {
  it("GET /health returns 200", async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.version).toBe("1.0.0");
  });

  it("GET /nonexistent returns 404", async () => {
    const res = await fetch(`${BASE}/nonexistent`);
    expect(res.status).toBe(404);
  });
});

describe("Task API", () => {
  describe("POST /api/tasks", () => {
    it("creates a task", async () => {
      const res = await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Build feature", priority: "high" }),
      });
      expect(res.status).toBe(201);
      const { data } = await res.json();
      expect(data.title).toBe("Build feature");
      expect(data.priority).toBe("high");
      expect(data.status).toBe("todo");
    });

    it("rejects empty title", async () => {
      const res = await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects missing title", async () => {
      const res = await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/tasks", () => {
    it("returns empty list initially", async () => {
      const res = await fetch(`${BASE}/api/tasks`);
      const { data, count } = await res.json();
      expect(count).toBe(0);
      expect(data).toEqual([]);
    });

    it("returns created tasks", async () => {
      await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "A" }),
      });
      await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "B" }),
      });
      const res = await fetch(`${BASE}/api/tasks`);
      const { count } = await res.json();
      expect(count).toBe(2);
    });

    it("filters by status", async () => {
      await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "A" }),
      });
      const created = await (
        await fetch(`${BASE}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "B" }),
        })
      ).json();
      await fetch(`${BASE}/api/tasks/${created.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      const res = await fetch(`${BASE}/api/tasks?status=todo`);
      const { count } = await res.json();
      expect(count).toBe(1);
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("returns a task", async () => {
      const created = await (
        await fetch(`${BASE}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Find me" }),
        })
      ).json();
      const res = await fetch(`${BASE}/api/tasks/${created.data.id}`);
      const { data } = await res.json();
      expect(data.title).toBe("Find me");
    });

    it("returns 404 for missing task", async () => {
      const res = await fetch(`${BASE}/api/tasks/999`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("updates a task", async () => {
      const created = await (
        await fetch(`${BASE}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Original" }),
        })
      ).json();
      const res = await fetch(`${BASE}/api/tasks/${created.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated", status: "in_progress" }),
      });
      const { data } = await res.json();
      expect(data.title).toBe("Updated");
      expect(data.status).toBe("in_progress");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("deletes a task", async () => {
      const created = await (
        await fetch(`${BASE}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Delete me" }),
        })
      ).json();
      const res = await fetch(`${BASE}/api/tasks/${created.data.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      const list = await (await fetch(`${BASE}/api/tasks`)).json();
      expect(list.count).toBe(0);
    });
  });

  describe("GET /api/stats", () => {
    it("returns correct stats", async () => {
      await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "A" }),
      });
      await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "B" }),
      });
      const created = await (
        await fetch(`${BASE}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "C" }),
        })
      ).json();
      await fetch(`${BASE}/api/tasks/${created.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      const res = await fetch(`${BASE}/api/stats`);
      const { data } = await res.json();
      expect(data.total).toBe(3);
      expect(data.todo).toBe(2);
      expect(data.done).toBe(1);
    });
  });
});
