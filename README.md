# Credsetu

A full-stack personal loan tracking application built with an Express + PostgreSQL backend and an Expo React Native mobile app.

The project helps users manage money they have lent to friends or family, track repayment status, and keep loan receipts attached to each record.

## Demo Video
<div align="center"> 
<a href="https://www.youtube.com/shorts/0Tzte6LvDc0"> 
<img src="https://img.youtube.com/vi/0Tzte6LvDc0/0.jpg" alt="Project Demo Video" width="600"> 
</a> 
</div>

- Watch the project demo: [YouTube Demo Video](https://www.youtube.com/shorts/0Tzte6LvDc0)

## Overview

This repository contains:

- `backend/` — Node.js/TypeScript API for user authentication, loan creation, summary reporting, and loan updates
- `mob/` — Expo mobile app for Android/iOS/web viewing and managing loans
- `uploads/` — uploaded receipt images stored by the backend
- `docker-compose.yml` — local PostgreSQL + backend container setup

## Features

- Phone-based mock login flow
- Add new loan records with amount, due date, reason, and optional receipt image
- Track loan status: pending, repaid, overdue
- View all loans for a user
- See dashboard summary values for total lent, repaid, and overdue amounts
- Open individual loan details
- Attach image receipts to a loan entry

## Tech Stack

### Backend
- Node.js
- TypeScript
- Express
- PostgreSQL
- Sequelize ORM
- Multer for file uploads

### Mobile app
- Expo
- React Native
- React Navigation / Expo Router
- AsyncStorage for session state
- React Query and Axios for API calls

## Project Structure

```text
Credsetu/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── mob/
│   ├── src/
│   ├── package.json
│   └── README.md
├── uploads/
├── docker-compose.yml
├── README.md
└── ...
```

## Backend API

The backend exposes the following routes under `/api`:

- `POST /api/login` — mock login with phone number, returns a user ID and logs a mock OTP to the server console
- `POST /api/loans` — create a new loan entry; accepts multipart form data with optional `receipt` upload
- `PATCH /api/loans/:id/repaid` — mark a loan as repaid
- `GET /api/loans` — fetch all loans for a user
- `GET /api/loans/summary` — fetch summary totals for a user
- `GET /api/loans/:id` — fetch details for one loan

## Local Development

### 1) Start the database and API with Docker

From the project root:

```bash
docker-compose up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- The backend API on `http://localhost:5000`

### 2) Configure Mobile App API Endpoint

To test the mobile app on a physical device or emulator using Expo Go, point your API client to your computer's local network IP address.

1. Open Command Prompt (CMD) and run `ipconfig` to find your computer's **IPv4 Address** (e.g., `192.168.0.102`).
2. Open `mob/src/constants/api.ts` and set your IP address:

```typescript
export const API_URL = "http://192.168.0.102:5000";
```

### 3) Run the mobile app

Open a terminal in `mob/` and install dependencies:

```bash
cd mob
npm install
npm start
```

Then launch the app in a simulator, emulator, or Expo Go.

### 4) Run backend directly without Docker

```bash
cd backend
npm install
npm run dev
```

Make sure PostgreSQL is available and set the `DATABASE_URL` environment variable if needed.

## Environment Variables

The backend uses the following environment variables:

- `PORT` — backend port, default `5000`
- `DATABASE_URL` — PostgreSQL connection string

Example:

```bash
export PORT=5000
export DATABASE_URL=postgres://postgres:mysecretpassword@localhost:5432/mydatabase
```

## Notes

- Uploaded receipt images are stored in the `uploads/` folder and served publicly at `/uploads/...`.
- The app includes a mock OTP login flow designed for development/testing, where the OTP is printed in the backend console.
- Sequelize automatically syncs database models at runtime using `sequelize.sync({ alter: true })`.

## License

This project currently includes the mobile app license files from the Expo template and is intended for local/demo use unless otherwise specified.