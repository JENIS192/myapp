# Apex Garage – Koenigsegg (Jesko Absolut) & BMW store
3-tier: `frontend/` (Vite React) → `backend/` (Node/Express, port 5000) → MySQL. No CORS package anywhere: the browser calls `/api` on its own origin (Vite proxy in dev, Nginx in prod).

## Run
1. `mysql -u root -p < database/schema.sql`
2. `cd backend && npm install && npm start`  (edit `backend/.env` first)
3. `cd frontend && npm install && npm run dev`  → http://localhost:5173
4. Health check: `curl http://localhost:5000/api/hell/health`

## AWS-style deploy
RDS MySQL (set DB_HOST in backend/.env) · EC2 backend with pm2 (`pm2 start server.js`) · `npm run build` in frontend, copy `dist/` to Nginx using `deploy/nginx.conf`. Open security-group port 80 only; keep 5000 and 3306 private.
Use an ALB/target-group health path of `/api/hell/health`.
