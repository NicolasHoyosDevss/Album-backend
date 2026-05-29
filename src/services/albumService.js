import { query, withTransaction } from '../config/database.js';

const DEFAULT_NICKNAME = 'My album';

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

function normalizeCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function toAlbumDto(album) {
  return {
    id: album.id,
    nickname: album.nickname,
    updatedAt: album.updated_at,
  };
}

function handleDatabaseError(error, fallbackMessage = 'Database error') {
  throw new AppError(error.message || fallbackMessage, 500);
}

function validateRequiredCode(value, fieldName) {
  const normalized = normalizeCode(value);

  if (!normalized) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  return normalized;
}

function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new AppError('Invalid quantity', 400);
  }

  return quantity;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AppError('Invalid amount', 400);
  }

  return amount;
}

function rowsToProgress(rows = []) {
  return rows.reduce((progress, row) => {
    if (row.quantity > 0) {
      progress[row.sticker_code] = row.quantity;
    }

    return progress;
  }, {});
}

async function findAlbumByUserId(userId) {
  const { rows } = await query(
    `
      select id, user_id, nickname, updated_at
      from albums
      where user_id = $1
    `,
    [userId],
  );

  if (!rows[0]) {
    throw new AppError('Album not found', 404);
  }

  return rows[0];
}

async function getCurrentStickerQuantity(albumId, stickerCode) {
  const { rows } = await query(
    `
      select quantity
      from album_stickers
      where album_id = $1
        and sticker_code = $2
    `,
    [albumId, stickerCode],
  );

  return rows[0]?.quantity ?? 0;
}

async function upsertStickerQuantity(albumId, stickerCode, quantity) {
  await query(
    `
      insert into album_stickers (album_id, sticker_code, quantity)
      values ($1, $2, $3)
      on conflict (album_id, sticker_code)
      do update set quantity = excluded.quantity
    `,
    [albumId, stickerCode, quantity],
  );
}

async function deleteStickerQuantity(albumId, stickerCode) {
  await query(
    `
      delete from album_stickers
      where album_id = $1
        and sticker_code = $2
    `,
    [albumId, stickerCode],
  );
}

async function setStickerQuantity(albumId, stickerCode, quantity) {
  if (quantity === 0) {
    await deleteStickerQuantity(albumId, stickerCode);
  } else {
    await upsertStickerQuantity(albumId, stickerCode, quantity);
  }

  return { stickerCode, quantity };
}

export async function createAlbum(userId, nickname = DEFAULT_NICKNAME) {
  const safeNickname = typeof nickname === 'string' && nickname.trim()
    ? nickname.trim()
    : DEFAULT_NICKNAME;

  try {
    const { rows } = await query(
      `
        insert into albums (user_id, nickname)
        values ($1, $2)
        on conflict (user_id) do nothing
        returning id, user_id, nickname, updated_at
      `,
      [userId, safeNickname],
    );

    if (rows[0]) {
      return { album: toAlbumDto(rows[0]) };
    }

    return getAlbum(userId);
  } catch (error) {
    handleDatabaseError(error, 'Could not create album');
  }
}

export async function getAlbum(userId) {
  const album = await findAlbumByUserId(userId);

  return { album: toAlbumDto(album) };
}

export async function getAlbumProgress(userId) {
  const album = await findAlbumByUserId(userId);

  const { rows } = await query(
    `
      select sticker_code, quantity
      from album_stickers
      where album_id = $1
        and quantity > 0
      order by sticker_code asc
    `,
    [album.id],
  );

  return {
    album: toAlbumDto(album),
    progress: rowsToProgress(rows),
  };
}

export async function getTeamProgress(userId, teamCode) {
  const album = await findAlbumByUserId(userId);
  const normalizedTeamCode = validateRequiredCode(teamCode, 'teamCode');

  const { rows } = await query(
    `
      select sticker_code, quantity
      from album_stickers
      where album_id = $1
        and sticker_code like $2
        and quantity > 0
      order by sticker_code asc
    `,
    [album.id, `${normalizedTeamCode}\\_%`],
  );

  return {
    album: toAlbumDto(album),
    teamCode: normalizedTeamCode,
    progress: rowsToProgress(rows),
  };
}

export async function updateSticker(userId, stickerCode, quantity) {
  const album = await findAlbumByUserId(userId);
  const normalizedStickerCode = validateRequiredCode(stickerCode, 'stickerCode');
  const validQuantity = validateQuantity(quantity);

  return setStickerQuantity(album.id, normalizedStickerCode, validQuantity);
}

export async function incrementSticker(userId, stickerCode, amount = 1) {
  const album = await findAlbumByUserId(userId);
  const normalizedStickerCode = validateRequiredCode(stickerCode, 'stickerCode');
  const validAmount = validateAmount(amount ?? 1);
  const currentQuantity = await getCurrentStickerQuantity(album.id, normalizedStickerCode);
  const nextQuantity = currentQuantity + validAmount;

  return setStickerQuantity(album.id, normalizedStickerCode, nextQuantity);
}

export async function decrementSticker(userId, stickerCode, amount = 1) {
  const album = await findAlbumByUserId(userId);
  const normalizedStickerCode = validateRequiredCode(stickerCode, 'stickerCode');
  const validAmount = validateAmount(amount ?? 1);
  const currentQuantity = await getCurrentStickerQuantity(album.id, normalizedStickerCode);
  const nextQuantity = Math.max(0, currentQuantity - validAmount);

  return setStickerQuantity(album.id, normalizedStickerCode, nextQuantity);
}

export async function updateStickersBatch(userId, stickers) {
  const album = await findAlbumByUserId(userId);

  if (!stickers || typeof stickers !== 'object' || Array.isArray(stickers)) {
    throw new AppError('Invalid stickers', 400);
  }

  const entries = Object.entries(stickers).map(([stickerCode, quantity]) => [
    validateRequiredCode(stickerCode, 'stickerCode'),
    validateQuantity(quantity),
  ]);

  const positiveRows = entries
    .filter(([, quantity]) => quantity > 0)
    .map(([stickerCode, quantity]) => ({
      album_id: album.id,
      sticker_code: stickerCode,
      quantity,
    }));

  const zeroCodes = entries
    .filter(([, quantity]) => quantity === 0)
    .map(([stickerCode]) => stickerCode);

  await withTransaction(async (client) => {
    if (positiveRows.length > 0) {
      const values = [];
      const placeholders = positiveRows.map((row, index) => {
        const offset = index * 3;

        values.push(row.album_id, row.sticker_code, row.quantity);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      });

      await client.query(
        `
          insert into album_stickers (album_id, sticker_code, quantity)
          values ${placeholders.join(', ')}
          on conflict (album_id, sticker_code)
          do update set quantity = excluded.quantity
        `,
        values,
      );
    }

    if (zeroCodes.length > 0) {
      await client.query(
        `
          delete from album_stickers
          where album_id = $1
            and sticker_code = any($2::text[])
        `,
        [album.id, zeroCodes],
      );
    }
  });

  return { updated: entries.length };
}

export { AppError };
