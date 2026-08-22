import { MangaHostParser } from './MangaHostParser';

/**
 * Paperback iOS Source Definition for MangaHost (Cloudflare R2 + Go API)
 */
export const MangaHostInfo = {
  version: '1.0.0',
  name: 'MangaHost R2',
  icon: 'icon.png',
  author: 'MangaHost',
  authorWebsite: 'https://github.com/Paperback-iOS',
  description: 'Extension đọc manga từ self-hosted MangaHost API lưu trữ trên Cloudflare R2',
  contentRating: 'EVERYONE',
  websiteBaseURL: 'http://localhost:8080/api/v1' // Default API URL, can be configured in settings
};

export class MangaHostSource {
  // Base API URL
  private apiBase: string;

  constructor(private App: any) {
    this.apiBase = MangaHostInfo.websiteBaseURL.replace(/\/$/, '');
  }

  /**
   * Get Manga Details
   */
  async getMangaDetails(mangaId: string): Promise<any> {
    const request = this.App.createRequest({
      url: `${this.apiBase}/manga/${mangaId}`,
      method: 'GET'
    });

    const response = await this.App.fetch(request);
    const json = JSON.parse(response.data);
    return MangaHostParser.parseMangaDetails(json, mangaId, this.App);
  }

  /**
   * Get Chapters for Manga
   */
  async getChapters(mangaId: string): Promise<any[]> {
    const request = this.App.createRequest({
      url: `${this.apiBase}/manga/${mangaId}`,
      method: 'GET'
    });

    const response = await this.App.fetch(request);
    const json = JSON.parse(response.data);
    return MangaHostParser.parseChapterList(json, mangaId, this.App);
  }

  /**
   * Get Chapter Details (Pages)
   */
  async getChapterDetails(mangaId: string, chapterId: string): Promise<any> {
    const request = this.App.createRequest({
      url: `${this.apiBase}/chapter/${chapterId}`,
      method: 'GET'
    });

    const response = await this.App.fetch(request);
    const json = JSON.parse(response.data);
    return MangaHostParser.parseChapterDetails(json, mangaId, chapterId, this.App);
  }

  /**
   * Search Manga / Filter
   */
  async getSearchResults(query: any, metadata: any): Promise<any> {
    const page = metadata?.page ?? 1;
    const searchTitle = query?.title ?? '';

    const url = `${this.apiBase}/manga?q=${encodeURIComponent(searchTitle)}&page=${page}&limit=20`;
    const request = this.App.createRequest({
      url,
      method: 'GET'
    });

    const response = await this.App.fetch(request);
    const json = JSON.parse(response.data);
    return MangaHostParser.parseSearchResults(json, this.App);
  }

  /**
   * Home Page Sections for Paperback App Home Tab
   */
  async getHomePageSections(sectionCallback: (section: any) => void): Promise<void> {
    // 1. Featured / Top Section
    const featuredSection = this.App.createHomeSection({
      id: 'featured',
      title: 'Truyện Nổi Bật',
      type: 'featured',
      containsMoreItems: false
    });

    // 2. Latest Updates Section
    const latestSection = this.App.createHomeSection({
      id: 'latest',
      title: 'Mới Cập Nhật',
      containsMoreItems: true
    });

    // 3. Popular Section
    const popularSection = this.App.createHomeSection({
      id: 'popular',
      title: 'Xem Nhiều Nhất',
      containsMoreItems: true
    });

    // Fetch Home data from API
    try {
      const request = this.App.createRequest({
        url: `${this.apiBase}/home`,
        method: 'GET'
      });
      const response = await this.App.fetch(request);
      const json = JSON.parse(response.data);
      const data = json.data;

      if (data?.featured) {
        featuredSection.items = data.featured.map((m: any) =>
          this.App.createPartialSourceManga({
            mangaId: m.slug || m.id,
            image: m.coverUrl || '',
            title: m.title,
            subtitle: m.lastChapterNumber !== undefined ? `Ch. ${m.lastChapterNumber}` : undefined
          })
        );
        sectionCallback(featuredSection);
      }

      if (data?.latest) {
        latestSection.items = data.latest.map((m: any) =>
          this.App.createPartialSourceManga({
            mangaId: m.slug || m.id,
            image: m.coverUrl || '',
            title: m.title,
            subtitle: m.lastChapterNumber !== undefined ? `Ch. ${m.lastChapterNumber}` : undefined
          })
        );
        sectionCallback(latestSection);
      }

      if (data?.popular) {
        popularSection.items = data.popular.map((m: any) =>
          this.App.createPartialSourceManga({
            mangaId: m.slug || m.id,
            image: m.coverUrl || '',
            title: m.title,
            subtitle: m.lastChapterNumber !== undefined ? `Ch. ${m.lastChapterNumber}` : undefined
          })
        );
        sectionCallback(popularSection);
      }
    } catch (err) {
      console.error('Failed to fetch home sections in Paperback:', err);
    }
  }

  /**
   * View More Items when tapping 'More' on a Home Page Section
   */
  async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<any> {
    const page = metadata?.page ?? 1;
    let sortBy = 'updatedAt';
    if (homepageSectionId === 'popular') {
      sortBy = 'views';
    }

    const request = this.App.createRequest({
      url: `${this.apiBase}/manga?sort=${sortBy}&page=${page}&limit=20`,
      method: 'GET'
    });

    const response = await this.App.fetch(request);
    const json = JSON.parse(response.data);
    return MangaHostParser.parseSearchResults(json, this.App);
  }
}
