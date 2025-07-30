import type { PexelsImage } from '../../app.d.ts';

export class PexelsService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRandomPhoto(query: string = 'nature art landscape abstract'): Promise<PexelsImage | null> {
    try {
      // Get a random page (1-100) to ensure variety
      const randomPage = Math.floor(Math.random() * 100) + 1;

      const response = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=20&page=${randomPage}`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        // Select a random photo from the results
        const randomIndex = Math.floor(Math.random() * data.photos.length);
        return data.photos[randomIndex];
      }

      return null;
    } catch (error) {
      console.error('Error fetching from Pexels:', error);
      return null;
    }
  }

  async getCuratedPhotos(page: number = 1, perPage: number = 20): Promise<PexelsImage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/curated?per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.photos || [];
    } catch (error) {
      console.error('Error fetching curated photos from Pexels:', error);
      return [];
    }
  }

  async searchPhotos(query: string, page: number = 1, perPage: number = 20): Promise<PexelsImage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.photos || [];
    } catch (error) {
      console.error('Error searching photos from Pexels:', error);
      return [];
    }
  }
}
