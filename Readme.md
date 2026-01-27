# Video Platform Backend API

A scalable backend for a YouTube/Twitter-style platform built with Node.js, Express, and MongoDB.  
Focused on real-world backend problems like authentication, authorization, data relationships, and analytics.

---

## Tech Stack

- **Node.js** – Runtime
- **Express.js** – Web framework
- **MongoDB** – Database
- **Mongoose** – ODM
- **JWT (Access & Refresh Tokens)** – Authentication
- **bcrypt** – Password hashing
- **ImageKit** – Media storage

---

## What This Backend Supports

- User authentication with JWT
- Video upload and management
- Likes on videos, comments, and tweets
- Comment system with pagination
- Playlists (create, update, add/remove videos)
- Channel subscriptions and dashboards
- Tweets (create, update, delete)
- Aggregation-based analytics (views, likes, subscribers)

---

## API Snapshot

POST /api/v1/auth/login
POST /api/v1/videos
POST /api/v1/likes/toggle/v/:videoId
POST /api/v1/subscriptions/c/:channelId
GET /api/v1/dashboard/stats
PATCH /api/v1/playlists/add/:videoId/:playlistId


(All routes are protected unless stated otherwise.)

---

## Project Structure

src/
├── controllers/
├── models/
├── routes/
├── middlewares/
├── utils/
└── app.js


---

## Environment Variables

Create a `.env` file with the following values:

PORT=8000
MONGODB_URI=your_mongodb_uri

ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=


---

## Run Locally

git clone https://github.com/Rishitttttt/real.git
cd your-repo-name
npm install
npm run dev


---

## Design Notes

- MongoDB aggregation pipelines are used to avoid N+1 queries
- Like and subscription systems are implemented as toggle operations
- Authorization is enforced at the controller level
- Codebase is structured to support future real-time features

---

## Future Scope

- Real-time notifications (likes, comments, subscriptions)
- Redis caching for frequently accessed counts
- Rate limiting and abuse protection

---

## Author

**Rishit**  
Backend-focused developer