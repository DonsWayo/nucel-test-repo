# nucel-test-repo

Test repository for [Nucel](https://github.com/DonsWayo/nucel-app) workspace orchestration.

## Setup

```bash
npm install
```

## Usage

```bash
npm start        # Start the server
npm run dev      # Start with watch mode
npm test         # Run tests
npm run lint     # Lint code
npm run build    # Build for production
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get task by ID |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/stats` | Task statistics |

## Project Structure

```
src/
  index.js          # Entry point & server
  routes/
    tasks.js        # Task CRUD routes
    health.js       # Health check
  models/
    task.js         # Task model (in-memory store)
  middleware/
    validate.js     # Request validation
    logger.js       # Request logging
  utils/
    errors.js       # Error classes
tests/
  tasks.test.js     # Task API tests
  health.test.js    # Health check tests
  model.test.js     # Model unit tests
```

## License

MIT
