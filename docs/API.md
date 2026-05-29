# API Reference

Base path: `/api`

## Health

```http
GET /api/health
```

Response:

```json
{ "status": "ok" }
```

## Authentication

All `/api/me/*` routes require a Supabase access token:

```http
Authorization: Bearer <supabase-access-token>
```

The backend validates the token with Supabase Auth and uses the authenticated user id as the album owner.

## Album

### Create or return the current user's album

```http
POST /api/me/album
Content-Type: application/json

{ "nickname": "My album" }
```

### Get album metadata

```http
GET /api/me/album
```

### Get full progress

```http
GET /api/me/album/progress
```

Example response:

```json
{
  "album": {
    "id": "5b2b0c78-1e3c-4e8d-8c4d-8d3e3a7db111",
    "nickname": "My album",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  },
  "progress": {
    "COL_14": 2,
    "ARG_17": 1
  }
}
```

### Get team progress

```http
GET /api/me/album/progress/team/:teamCode
```

### Replace one sticker quantity

```http
PUT /api/me/album/stickers/:stickerCode
Content-Type: application/json

{ "quantity": 2 }
```

### Increment or decrement one sticker

```http
POST /api/me/album/stickers/:stickerCode/increment
Content-Type: application/json

{ "amount": 1 }
```

```http
POST /api/me/album/stickers/:stickerCode/decrement
Content-Type: application/json

{ "amount": 1 }
```

### Batch update sticker quantities

```http
PUT /api/me/album/stickers
Content-Type: application/json

{
  "stickers": {
    "COL_14": 2,
    "ARG_17": 0
  }
}
```

## Validation rules

- Sticker and team codes are trimmed and normalized to uppercase.
- `quantity` must be an integer greater than or equal to `0`.
- `amount` must be an integer greater than `0`.
- Quantity `0` removes that sticker row from storage.