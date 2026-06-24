# StudySync Backend API

This backend is an Express + MongoDB API. All request and response bodies are JSON unless noted otherwise.

## Base URL

- Local development: `http://localhost:<PORT>/api`
- The app exposes a health check at `/api/status`

## Authentication

- `register` and `login` return an `accessToken` in the response body.
- A `refreshToken` cookie is also set by the server on registration and login.
- Protected routes expect the access token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

- The task routes are protected by JWT middleware.

## Common Data Formats

- `email`: valid email string
- `password`: string, minimum 8 characters for registration
- `username`: string, 3 to 30 characters
- `first_name` / `last_name`: string, 1 to 50 characters
- `year_of_study`: integer from 1 to 6
- `deadline`: valid future date string, preferably ISO 8601
- `priority`: number from 1 to 10
- `status`: one of `pending`, `completed`, or `cancelled`

## Endpoints

### Status

| Endpoint | Type | Auth | Data Format | Response |
| --- | --- | --- | --- | --- |
| `/api/status` | `GET` | No | None | Plain text `Hello, World!` |

### Auth

| Endpoint | Type | Auth | Request Body / Query | Response |
| --- | --- | --- | --- | --- |
| `/api/auth/register` | `POST` | No | JSON body: `first_name`, `last_name`, `email`, `password`, `username`, `year_of_study` | `201` with `accessToken` and `user` |
| `/api/auth/login` | `POST` | No | JSON body: `email`, `password` | `200` with `accessToken` and `user` |
| `/api/auth/me` | `GET` | Yes | None | Current user profile |
| `/api/auth/me` | `PATCH` | Yes | JSON body: any of `first_name`, `last_name`, `year_of_study` | Updated user profile |
| `/api/auth/emailverify` | `POST` | Yes | None | Sends a verification email |
| `/api/auth/emailverify` | `GET` | No | Query: `token` | Verifies the email token |
| `/api/auth/forgot_password` | `POST` | No | JSON body: `email` | Sends a password reset email |
| `/api/auth/reset_password` | `POST` | No | Query: `token`, JSON body: `new_password` | Resets the password |
| `/api/auth/logout` | `POST` | Yes | None | Clears the refresh token and logs out |

#### Auth Request Examples

Register:

```json
{
  "first_name": "Ava",
  "last_name": "Stone",
  "email": "ava@example.com",
  "password": "securepass123",
  "username": "avastone",
  "year_of_study": 3
}
```

Login:

```json
{
  "email": "ava@example.com",
  "password": "securepass123"
}
```

Update profile:

```json
{
  "first_name": "Ava",
  "year_of_study": 4
}
```

Reset password:

```json
{
  "new_password": "newsecurepass123"
}
```

### Tasks

| Endpoint | Type | Auth | Request Body / Query | Response |
| --- | --- | --- | --- | --- |
| `/api/tasks` | `POST` | Yes | JSON body: `title`, `description`, `deadline`, `priority` | `201` with `message` and created `task` |
| `/api/tasks` | `GET` | Yes | Query: `page`, `limit` | `200` with `count` and `tasks` |
| `/api/tasks/:id` | `GET` | Yes | Path param: task id | `200` with `task` |
| `/api/tasks/:id` | `PUT` | Yes | JSON body: any of `title`, `description`, `deadline`, `status`, `priority` | `200` with `message` and updated `task` |
| `/api/tasks/:id` | `DELETE` | Yes | Path param: task id | `200` with `message` |

#### Task Request Example

```json
{
  "title": "Study math chapter 4",
  "description": "Review practice problems and notes",
  "deadline": "2026-07-01T18:00:00.000Z",
  "priority": 7
}
```

#### Task Response Shape

```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "...",
    "user": "...",
    "title": "Study math chapter 4",
    "description": "Review practice problems and notes",
    "deadline": "2026-07-01T18:00:00.000Z",
    "status": "pending",
    "priority": 7,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## User Object

The API returns a safe user object without sensitive fields like `password` or `refreshToken`.

```json
{
  "id": "...",
  "first_name": "Ava",
  "last_name": "Stone",
  "username": "avastone",
  "email": "ava@example.com",
  "year_of_study": 3,
  "isVerified": false
}
```

## Notes

- Errors are returned as JSON with either `message` or `error` depending on the route.
- Task list pagination defaults to `page=1` and `limit=10`.
- `deadline` must be a future date.
- `priority` must be between `1` and `10`.