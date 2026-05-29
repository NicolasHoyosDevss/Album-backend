import { getSupabaseAuthClient } from '../config/supabase.js';
import { AppError } from '../services/albumService.js';

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return '';
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token;
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Unauthorized', 401);
    }

    const { data, error } = await getSupabaseAuthClient().auth.getUser(token);

    if (error || !data?.user) {
      throw new AppError('Unauthorized', 401);
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
    };

    next();
  } catch (error) {
    next(error);
  }
}
