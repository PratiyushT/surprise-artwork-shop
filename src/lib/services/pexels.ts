import type { PexelsImage } from '../../app.d.ts';
import { logger, logError, logAPICall } from '../logger.ts';

export class PexelsService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    logger.debug('🖼️  Initializing Pexels service', {
      baseUrl: this.baseUrl,
      keyPrefix: apiKey.substring(0, 8) + '...'
    });
    logger.pexels('Service initialized successfully');
  }

  async getRandomPhoto(query: string = 'nature art landscape abstract'): Promise<PexelsImage | null> {
    const endTimer = logger.startTimer('Pexels random photo fetch');

    // Get a random page (1-100) to ensure variety
    const randomPage = Math.floor(Math.random() * 100) + 1;
    const perPage = 20;

    logger.pexels('Fetching random photo', {
      query,
      randomPage,
      perPage,
      encodedQuery: encodeURIComponent(query)
    });

    try {
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${randomPage}`;

      logger.request('GET', url, {
        headers: { authorization: '***' }
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      logger.response(response.status, url, {
        ok: response.ok,
        statusText: response.statusText,
        headers: {
          contentType: response.headers.get('content-type'),
          rateLimit: response.headers.get('x-ratelimit-remaining'),
          rateLimitReset: response.headers.get('x-ratelimit-reset')
        }
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      logger.debug('📊 Pexels API response', {
        totalHits: data.total_results,
        photosReturned: data.photos?.length || 0,
        page: data.page,
        perPage: data.per_page,
        nextPage: data.next_page
      });

      if (data.photos && data.photos.length > 0) {
        // Select a random photo from the results
        const randomIndex = Math.floor(Math.random() * data.photos.length);
        const selectedPhoto = data.photos[randomIndex];

        logger.pexels('Random photo selected successfully', {
          photoId: selectedPhoto.id,
          photographer: selectedPhoto.photographer,
          width: selectedPhoto.width,
          height: selectedPhoto.height,
          url: selectedPhoto.url,
          randomIndex,
          totalOptions: data.photos.length
        });

        endTimer();
        return selectedPhoto;
      }

      logger.warn('📷 No photos found in Pexels response', {
        query,
        page: randomPage,
        totalResults: data.total_results
      });

      endTimer();
      return null;
    } catch (error) {
      endTimer();
      logError(error as Error, {
        query,
        randomPage,
        perPage,
        action: 'getRandomPhoto'
      });
      return null;
    }
  }

  async getCuratedPhotos(page: number = 1, perPage: number = 20): Promise<PexelsImage[]> {
    const endTimer = logger.startTimer('Pexels curated photos fetch');

    logger.pexels('Fetching curated photos', { page, perPage });

    try {
      const url = `${this.baseUrl}/curated?per_page=${perPage}&page=${page}`;

      logger.request('GET', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      logger.response(response.status, url, {
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const photos = data.photos || [];

      logger.pexels('Curated photos fetched successfully', {
        photosCount: photos.length,
        page: data.page,
        totalResults: data.total_results
      });

      endTimer();
      return photos;
    } catch (error) {
      endTimer();
      logError(error as Error, {
        page,
        perPage,
        action: 'getCuratedPhotos'
      });
      return [];
    }
  }

  async searchPhotos(query: string, page: number = 1, perPage: number = 20): Promise<PexelsImage[]> {
    const endTimer = logger.startTimer('Pexels photo search');

    logger.pexels('Searching photos', {
      query,
      page,
      perPage,
      encodedQuery: encodeURIComponent(query)
    });

    try {
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;

      logger.request('GET', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      logger.response(response.status, url, {
        ok: response.ok,
        statusText: response.statusText,
        headers: {
          rateLimit: response.headers.get('x-ratelimit-remaining'),
          rateLimitReset: response.headers.get('x-ratelimit-reset')
        }
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const photos = data.photos || [];

      logger.pexels('Photo search completed successfully', {
        query,
        photosFound: photos.length,
        totalResults: data.total_results,
        page: data.page,
        hasNextPage: !!data.next_page
      });

      endTimer();
      return photos;
    } catch (error) {
      endTimer();
      logError(error as Error, {
        query,
        page,
        perPage,
        action: 'searchPhotos'
      });
      return [];
    }
  }
}
