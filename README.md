# Ammerli API (Ammerli Backend)

<h1 align="center">
  <img src="https://github.com/nestjs/docs.nestjs.com/blob/master/src/assets/logo-small.svg" height="80" alt="Nest logo" />
  <img src="https://www.postgresql.org/media/img/about/press/elephant.png" height="80" alt="PostgreSQL logo" />
  <img src="https://raw.githubusercontent.com/redis/redis-stack/main/docs/logo/Redis_Logo_RGB.png" height="80" alt="Redis logo" />
  <img src="https://raw.githubusercontent.com/rabbitmq/rabbitmq-website/v3.12.x/site/img/logo-rabbitmq.svg" height="80" alt="RabbitMQ logo" />
</h1>

**Ammerli** is a specialized "Uber for Water" backend system designed for high-concurrency request management, real-time tracking, and fair driver matching. Built on top of a battle-tested NestJS architecture, it orchestrates complex service lifecycles from request initiation to fulfillment.

---

## 🏗️ Core Architecture & Tech Stack

This project follows **Clean Architecture** principles with a heavy emphasis on **Zero Technical Debt** and high documentation standards.

- **Framework:** [NestJS](https://nestjs.com/) (Express-based)
- **Primary Database:** [PostgreSQL](https://www.postgresql.org/) with [TypeORM](https://typeorm.io/)
- **Caching & Geospatial:** [Redis](https://redis.io/) (Used for real-time driver tracking and request indexing)
- **Message Broker:** [RabbitMQ](https://www.rabbitmq.com/) (Event-driven communication for dispatch logic)
- **Real-time:** [Socket.io](https://socket.io/) (Bi-directional communication for alerts and tracking)
- **Documentation:** "World-Class" JSDoc and [Swagger (OpenAPI 3)](https://swagger.io/)

---

## 🚀 Key Features

- **Request Lifecycle Management:** Sophisticated state machine handling `SEARCHING`, `ARRIVED`, `IN_PROGRESS`, and `COMPLETED` states with Redis-Postgres synchronization.
- **Fairness-Based Matching:** Advanced "Fairness & Logic" algorithm scoring drivers based on **Distance**, **Idle Time**, **Daily Balance**, and **Rating**.
- **Real-time Geolocation:** Redis Geospatial indexing for efficient "nearby driver" lookups.
- **Multi-Role RBAC:** Secure access control for `CLIENT`, `DRIVER`, and `ADMIN` roles.
- **Robust Event Flow:** Asynchronous task processing via RabbitMQ to ensure scalability and fault tolerance.
- **Internationalization:** Multi-language support via `nestjs-i18n`.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18+ 
- **Docker & Docker Compose**: For Database, Redis, and RabbitMQ
- **Package Manager**: `npm` (project standard)

### Installation

1. **Clone & Setup:**
```bash
git clone <repository-url>
cd ammerli
cp .env.example .env
```

2. **Start Infrastructure:**
```bash
docker-compose up -d
```

3. **Install Dependencies & Build:**
```bash
npm install
npm run build
```

4. **Seeding (Optional):**
```bash
npm run seed:run
```

### Running the App

```bash
# development
npm run start

# watch mode (preferred for dev)
npm run start:dev

# production
npm run start:prod
```

---

## 📂 Project Structure

```text
src/
├── api/                # Functional Modules
│   ├── auth/           # JWT, Registration, Session Management
│   ├── request/        # Request lifecycle & caching
│   ├── dispatch/       # Driver matching & assignment logic
│   ├── tracking/       # Real-time geolocation & WebSockets
│   └── user/           # Profile management
├── database/           # TypeORM entities, migrations, and seeds
├── common/             # Interceptors, decorators, and global types
├── constants/          # Errors, Logs, and System settings
└── logger/             # Custom structured Winston logger
```

---

## 🛡️ Documentation Standards

We maintain a **strict documentation protocol**:
- **Every Function/Method:** JSDoc blocks including `@param`, `@returns`, and `@throws`.
- **Core Algorithms:** Detailed inline explanations for non-obvious business rules.
- **Zero Technical Debt:** No `any` types, strict null checks, and immutable defaults.

---

## 🧪 Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
