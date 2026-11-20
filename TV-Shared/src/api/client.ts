import {API_BASE, ROCK_HOST} from '../config';
import type {HomeResponse, SeriesListResponse, SeriesResponse} from './types';

/** Thrown with a message that is safe to show on screen. */
export class ApiError extends Error {}

async function getJson<T>(pathOrUrl: string): Promise<T> {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : pathOrUrl.startsWith('/')
    ? ROCK_HOST + pathOrUrl
    : `${API_BASE}/${pathOrUrl}`;

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError(
      "We couldn't reach Shepherd Church. Check your internet connection.",
    );
  }
  if (!response.ok) {
    throw new ApiError(`The server returned an error (${response.status}).`);
  }

  // Rock labels these responses text/html, so parse the text ourselves.
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError('The server sent something the app could not read.');
  }
  if (data && typeof data.error === 'string') {
    throw new ApiError(data.error);
  }
  return data as T;
}

export const getHome = () => getJson<HomeResponse>('home');

export const getSeries = (idOrUrl: string) =>
  getJson<SeriesResponse>(
    idOrUrl.includes('/')
      ? idOrUrl
      : `series?id=${encodeURIComponent(idOrUrl)}`,
  );

export const getSeriesList = (urlOrChannel: string) =>
  getJson<SeriesListResponse>(
    urlOrChannel.includes('/')
      ? urlOrChannel
      : `series-list?channel=${urlOrChannel}`,
  );

/** Full image URL from a Rock image path, sized for the place it is shown. */
export function imageUrl(
  path: string | null | undefined,
  width: number,
): string | undefined {
  if (!path) {
    return undefined;
  }
  const base = path.startsWith('http') ? path : ROCK_HOST + path;
  return `${base}${base.includes('?') ? '&' : '?'}maxwidth=${Math.round(
    width,
  )}`;
}
