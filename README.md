## ⚙️ Backend Setup (`arthayuthi_stocks_backend`)

### 🔧 Prerequisites
- [Node.js](https://nodejs.org/) (v18 or above)
- [MongoDB](https://www.mongodb.com/try/download/community) (local or cloud e.g. Atlas)
- [Redis](https://redis.io/docs/getting-started/installation/) (local instance)

### 🔌 Installation
```bash
cd arthayuthi_stocks_backend
npm install
```

### 📄 Environment Variables
Create a `.env` file in the root of the backend folder:

```dotenv
PORT=4000
MONGO_URI=mongodb://localhost:27017/arthayuthi_stocks
JWT_SECRET=your_jwt_secret
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
REDIS_URL=redis://localhost:6379
EXPO_PUBLIC_API_URL=http://<your-ip>:4000
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query

```

> Replace `<your-ip>` with your local machine's IP (important for mobile testing)

### 🗃️ MongoDB Setup
- Run MongoDB locally (default port `27017`) or connect to MongoDB Atlas.
- No manual collection setup is required. Collections will be auto-created by Mongoose.

### 🧠 Redis Setup
If you don’t already have Redis:
- **macOS:** `brew install redis`
- **Linux:** `sudo apt install redis`
- **Windows:** Use [Memurai](https://www.memurai.com/) or Docker.

To start Redis:
```bash
redis-server
```

Ensure the server runs on the default port `6379` or update `REDIS_URL` in `.env` accordingly.

### ▶️ Run the Backend
```bash
npm run start
```
This starts the server with `ts-node-dev --respawn`. It should output:
```
✅ Server running on port 4000
```

---

# 🧠 Backend Architecture (Node.js + Express + MongoDB + Redis)

The backend is a REST API service built with Express.js, with MongoDB for persistent storage and Redis for session/token management.

### 🔧 Tech Stack

- **Node.js** with **TypeScript**
- **Express.js**
- **MongoDB with Mongoose**
- **Redis** (via `ioredis`)
- **JWT Authentication**
- **CORS for Security**
- **Alpha Vantage API** for stock data

### 📂 Folder Structure Highlights

```
arthayuthi_stocks_backend/
├── controllers/        # Route logic (auth, stocks, watchlist)
├── middleware/         # JWT validation, Redis session check
├── routes/             # API route definitions
├── services/           # External API integrations
├── utils/              # Token utils, error handling
├── models/             # Mongoose schemas (User, Watchlist)
```

### 🧰 Redis Usage

- Stores JWT sessions (userId → token)
- Blacklists tokens on logout
- Accelerates certain validations to reduce DB hits

### ⚠️ Backend Challenges Faced

| Challenge | Solution |
|----------|----------|
| **API rate limit on Alpha Vantage** | Enabled dynamic key change, cached data in Redis in apis where feasible  |
| **Ensuring token blacklist after logout** | Integrated Redis session and blacklisting logic using middleware |
| **Rate-limiting issues for mobile clients** | Applied `.env`-based IP configuration and verified CORS setup |
| **Race conditions in parallel requests (watchlist)** | Managed state properly via `useFetch` and confirmation toasts |
| **Cross-platform mobile testing** | Ensured `EXPO_PUBLIC_API_URL` used IP address instead of localhost for mobile access |
