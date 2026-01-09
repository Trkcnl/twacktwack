
# 🏋️ Twack Twack - Body & Workout Tracker

Twack Twack is a full-stack web application designed to track strength training progress and body measurements. It allows users to log complex workouts with nested exercises and sets, visualize their history, and monitor body metrics over time.

Built with performance and type safety in mind, utilizing **Django Rest Framework** for the backend and **React (Vite) + TypeScript** for the frontend.

## 🚀 Features

* **Authentication:** Secure JWT-based authentication with auto-refreshing tokens.
* **Workout Logging:** Record workout sessions including time, date, and multiple exercises.
* **Nested Sets:** Intuitive UI for managing sets (Reps, Weight, RIR) within exercises.
* **Body Tracking:** Log measurements (Weight, Waist, Arms, etc.) to track physical progress.
* **Responsive UI:** Modern, mobile-friendly interface built with Tailwind CSS and Shadcn UI.
* **Type Safety:** End-to-end type safety using Zod schemas and TypeScript interfaces.
* **Containerized:** Fully Dockerized development environment with PostgreSQL.

## 🛠 Tech Stack

### Backend

* **Framework:** Django 6.0 + Django REST Framework (DRF)
* **Database:** PostgreSQL 17
* **Authentication:** Simple JWT
* **Testing:** Pytest

### Frontend

* **Framework:** React 19 + Vite
* **Language:** TypeScript
* **State Management:** TanStack Query (React Query)
* **Styling:** Tailwind CSS + Shadcn UI (Radix Primitives)
* **Forms:** React Hook Form + Zod
* **Testing:** Vitest + React Testing Library

---

## ⚙️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* [Docker](https://www.docker.com/) and Docker Compose 
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/trkcnl/twacktwack.git
cd twacktwack

```

### 2. Environment Setup

Rename `.default-env` to `.env` then change values.


### 3. Run with Docker

Build and start the services. This will spin up the Django API, React Frontend, and PostgreSQL database.

```bash
docker compose up --build

```

* **Frontend:** Accessible at `http://localhost:5173`
* **Backend API:** Accessible at `http://localhost:8000/api/v1/`
* **Django Admin:** Accessible at `http://localhost:8000/admin/`

> **Note:** The first run might take a few moments as Docker downloads images and installs dependencies.

### 4. Create an Admin User

To log in to the application or the Django Admin, you need a superuser. Open a new terminal window while Docker is running:

```bash
docker compose exec backend python manage.py createsuperuser

```

Follow the prompts to set a username and password.

---

## 🧪 Running Tests

The project includes robust testing suites for both backend logic and frontend components.

### Backend Tests (Pytest)

Tests the API endpoints, serializers, and complex nested update logic.

```bash
# Run all tests inside the container
docker compose exec backend pytest api/tests

```

### Frontend Tests (Vitest)

Tests React components, hooks, and form validation.

```bash
# Run tests inside the container
docker compose exec frontend npm run test

```

---

## 📂 Project Structure

```text
.
├── backend/               # Django API
│   ├── api/               # Main App (Models, Views, Serializers)
│   └── backend/           # Project Settings
├── frontend/              # React App
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom hooks (React Query)
│   │   ├── pages/         # Route pages (Dashboard, WorkoutTwacker)
│   │   ├── services/      # Axios configuration
│   │   ├── tests/         # Vite test
│   │   └── types/         # TypeScript interfaces
└── docker-compose.yml     # Container orchestration

```