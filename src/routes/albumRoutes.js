import { Router } from 'express';
import {
  createAlbum,
  decrementSticker,
  getAlbum,
  getAlbumProgress,
  getTeamProgress,
  healthCheck,
  incrementSticker,
  updateSticker,
  updateStickersBatch,
} from '../controllers/albumController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/health', healthCheck);

router.use('/me', requireAuth);
router.post('/me/album', createAlbum);
router.get('/me/album', getAlbum);
router.get('/me/album/progress', getAlbumProgress);
router.get('/me/album/progress/team/:teamCode', getTeamProgress);
router.put('/me/album/stickers', updateStickersBatch);
router.put('/me/album/stickers/:stickerCode', updateSticker);
router.post('/me/album/stickers/:stickerCode/increment', incrementSticker);
router.post('/me/album/stickers/:stickerCode/decrement', decrementSticker);

export default router;
