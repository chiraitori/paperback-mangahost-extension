/**
 * Parser utilities for converting MangaHost REST API responses
 * into Paperback iOS data models.
 */

export interface MangaHostAPIItem {
  id: string;
  title: string;
  altTitles?: string[];
  slug: string;
  coverUrl: string;
  description?: string;
  author?: string;
  artist?: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled';
  genres?: string[];
  views?: number;
  rating?: number;
  lastChapterNumber?: number;
  chapterCount?: number;
}

export interface MangaHostChapterItem {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title?: string;
  volume?: number;
  language?: string;
  pages?: string[];
  pageCount: number;
  createdAt: string;
}

export class MangaHostParser {
  /**
   * Parse manga detail into Paperback SourceManga
   */
  static parseMangaDetails(json: any, mangaId: string, App: any): any {
    const manga: MangaHostAPIItem = json.data?.manga || json.manga || json;

    const titles = [manga.title];
    if (manga.altTitles && manga.altTitles.length > 0) {
      titles.push(...manga.altTitles);
    }

    const tagSections: any[] = [];
    if (manga.genres && manga.genres.length > 0) {
      tagSections.push(
        App.createTagSection({
          id: 'genres',
          label: 'Genres',
          tags: manga.genres.map((g) => App.createTag({ id: g, label: g }))
        })
      );
    }

    return App.createSourceManga({
      id: manga.slug || manga.id || mangaId,
      mangaInfo: App.createMangaInfo({
        titles,
        image: manga.coverUrl || '',
        status: manga.status === 'Completed' ? 'Completed' : 'Ongoing',
        author: manga.author || 'Unknown',
        artist: manga.artist || 'Unknown',
        desc: manga.description || '',
        tags: tagSections,
        rating: manga.rating || 5.0,
        hentai: false
      })
    });
  }

  /**
   * Parse chapter list into Paperback Chapter[]
   */
  static parseChapterList(json: any, mangaId: string, App: any, group = 'MangaHost R2'): any[] {
    const rawChapters: MangaHostChapterItem[] = json.data?.chapters || json.chapters || [];
    const chapters: any[] = [];

    for (const chap of rawChapters) {
      chapters.push(
        App.createChapter({
          id: chap.id,
          name: chap.title ? `Ch. ${chap.chapterNumber} - ${chap.title}` : `Chapter ${chap.chapterNumber}`,
          chapNum: chap.chapterNumber,
          volume: chap.volume,
          langCode: chap.language || 'vi',
          time: new Date(chap.createdAt),
          group
        })
      );
    }

    return chapters;
  }

  /**
   * Parse single chapter details into Paperback ChapterDetails (page URLs)
   */
  static parseChapterDetails(json: any, mangaId: string, chapterId: string, App: any): any {
    const rawChapter: MangaHostChapterItem = json.data?.chapter || json.chapter || json;
    const pages: string[] = (rawChapter.pages || []).filter(
      (page) => typeof page === 'string' && /^https?:\/\//i.test(page)
    );

    return App.createChapterDetails({
      id: chapterId,
      mangaId: mangaId,
      pages: pages
    });
  }

  /**
   * Parse catalog / search response into Paperback PagedResults
   */
  static parseSearchResults(json: any, App: any): any {
    const rawItems: MangaHostAPIItem[] = json.data?.data || json.data || [];
    const results: any[] = [];

    for (const item of rawItems) {
      results.push(
        App.createPartialSourceManga({
          mangaId: item.slug || item.id,
          image: item.coverUrl || '',
          title: item.title,
          subtitle: item.lastChapterNumber !== undefined ? `Ch. ${item.lastChapterNumber}` : undefined
        })
      );
    }

    return App.createPagedResults({
      results,
      metadata: json.data?.pagination ? { page: json.data.pagination.page + 1 } : undefined
    });
  }
}
