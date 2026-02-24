import * as TaskModel from "./models/task";
import { AppError, ValidationError } from "./utils/errors";

const PORT = Number(Bun.env.PORT) || 3000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method;

    try {
      // Health
      if (pathname === "/health" && method === "GET") {
        return Response.json({
          status: "ok",
          uptime: Math.round(process.uptime()),
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        });
      }

      // Parse body for mutations
      let body: any = {};
      if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
          body = await req.json();
        } catch {
          throw new AppError("Invalid JSON", 400);
        }
      }

      // Tasks collection
      if (pathname === "/api/tasks" && method === "GET") {
        const status = url.searchParams.get("status") || undefined;
        const tasks = TaskModel.list(status);
        return Response.json({ data: tasks, count: tasks.length });
      }

      if (pathname === "/api/tasks" && method === "POST") {
        if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
          throw new ValidationError("title is required");
        }
        const VALID_PRIORITIES = ["low", "medium", "high", "critical"];
        if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
          throw new ValidationError("priority must be one of: low, medium, high, critical");
        }
        const task = TaskModel.create(body);
        return Response.json({ data: task }, { status: 201 });
      }

      // Stats
      if (pathname === "/api/stats" && method === "GET") {
        return Response.json({ data: TaskModel.stats() });
      }

      // Single task: /api/tasks/:id
      const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
      if (taskMatch) {
        const id = taskMatch[1];
        if (method === "GET") {
          return Response.json({ data: TaskModel.get(id) });
        }
        if (method === "PUT") {
          const task = TaskModel.update(id, body);
          return Response.json({ data: task });
        }
        if (method === "DELETE") {
          const task = TaskModel.remove(id);
          return Response.json({ data: task, message: "Task deleted" });
        }
      }

      // 404
      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return Response.json({ error: err.message }, { status });
    }
  },
});

console.log(`Task API running on http://localhost:${server.port}`);

export { server };
