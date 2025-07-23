# CodeDesk

CodeDesk is a full-stack web application designed to help developers and learners stay organized, track progress, and master coding platforms effectively. It brings together the best resources, educators, and structured question sheets in one clean and interactive interface.

🔮 Coming Soon: AI-Powered Performance Tracking!
An intelligent system to analyze user activity and visualize progress with interactive graphs.

This monorepo contains two workspaces:

| Directory | Description |
|-----------|-------------|
| `backend/` | Node.js + Express + MongoDB REST API boilerplate |
| `client/`  | React + Vite + Tailwind CSS frontend skeleton |

## Prerequisites

- Node.js ≥ 18
- MongoDB instance (local or Atlas)

---
## Getting Started (Backend)

1. `cd backend`
2. `cp .env.example .env` – update `MONGO_URI` & `JWT_SECRET`.
3. `npm install`
4. `npm run dev` – starts API on <http://localhost:5000>

Seed dummy data:

```bash
npm run seed
```

---
## Getting Started (Frontend)

1. `cd client`
2. `npm install`
3. `npm run dev` – opens Vite dev server on <http://localhost:3000>

---
## Contributing

Refer to the issues tab for new features/pages. Feel free to open PRs following contributor guidelines.

---
## License

MIT 
