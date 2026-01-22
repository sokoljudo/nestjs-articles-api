# NestJS Articles API

REST API для управления статьями с JWT аутентификацией и Redis кэшированием.

---

## Быстрый старт

### 1. Установка

git clone <repo-url>
cd articles-api
npm install
cp .env.example .env

### 2. Настройка `.env`

# Database

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres-user
DB_PASSWORD=Qwer1234
DB_NAME=articles

# PostgreSQL Docker

POSTGRES_DB=articles
POSTGRES_USER=postgres-user
POSTGRES_PASSWORD=Qwer1234

# Redis

REDIS_HOST=localhost
REDIS_PORT=6379

# JWT

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d

# App

PORT=3000

### 3. Запуск

docker-compose up -d
npm run migration:run
npm run start:dev

**Swagger:** http://localhost:3000/api/docs

---

## API Endpoints

### Authentication

- POST /auth/register — регистрация
- POST /auth/login — авторизация
- GET /auth/me — данные пользователя 🔒

### Articles

- GET /articles — список с пагинацией и фильтрами
- GET /articles/:id — получить статью
- POST /articles — создать 🔒
- PATCH /articles/:id — обновить 🔒
- DELETE /articles/:id — удалить 🔒

🔒 — требует JWT токен в header: Authorization: Bearer <token>

---

## Основные команды

# Development

npm run start:dev
npm run start:prod

# Миграции

npm run migration:generate -- src/database/migrations/Name
npm run migration:run
npm run migration:revert

# Тестирование

npm run test
npm run test:cov
npm run test:e2e

# Docker

docker-compose up -d
docker-compose down
docker-compose logs db

---

## Возможности

✅ JWT аутентификация с bcrypt
✅ CRUD операции для статей
✅ Пагинация, фильтрация, сортировка
✅ Redis кэширование (TTL 5 мин)
✅ Автоматическая инвалидация кэша
✅ TypeORM миграции
✅ Валидация данных (class-validator)
✅ Swagger документация
✅ Unit тесты с моками

---

## Кэширование

**Кэшируется:**

- GET /articles → articles:list:page:X:limit:Y:...
- GET /articles/:id → article:{uuid}

**Инвалидация:**

- Создание/обновление/удаление статьи → сброс кэша

---

## Troubleshooting

**PostgreSQL не подключается:**
docker-compose ps
docker-compose logs db

**Redis не работает:**
docker-compose exec redis redis-cli ping

**Миграции падают:**
docker-compose down -v
docker-compose up -d
npm run migration:run

---

## Требования

- Node.js >= 18
- Docker & Docker Compose
- npm >= 9

---

**2026 © Judodev**
