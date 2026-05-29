import * as albumService from '../services/albumService.js';

export async function healthCheck(req, res) {
  res.json({ status: 'ok' });
}

export async function createAlbum(req, res, next) {
  try {
    const result = await albumService.createAlbum(req.user.id, req.body?.nickname);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAlbum(req, res, next) {
  try {
    const result = await albumService.getAlbum(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAlbumProgress(req, res, next) {
  try {
    const result = await albumService.getAlbumProgress(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTeamProgress(req, res, next) {
  try {
    const result = await albumService.getTeamProgress(req.user.id, req.params.teamCode);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateSticker(req, res, next) {
  try {
    const result = await albumService.updateSticker(
      req.user.id,
      req.params.stickerCode,
      req.body?.quantity,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function incrementSticker(req, res, next) {
  try {
    const result = await albumService.incrementSticker(
      req.user.id,
      req.params.stickerCode,
      req.body?.amount ?? 1,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function decrementSticker(req, res, next) {
  try {
    const result = await albumService.decrementSticker(
      req.user.id,
      req.params.stickerCode,
      req.body?.amount ?? 1,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateStickersBatch(req, res, next) {
  try {
    const result = await albumService.updateStickersBatch(req.user.id, req.body?.stickers);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
