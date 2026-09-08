import {
  Source,
  SourceInfo,
  ContentRating,
  Chapter,
  ChapterDetails,
  HomeSection,
  PagedResults,
  Request,
  Response,
  SearchRequest,
  SourceManga,
  TagSection
} from '@paperback/types'
import { MangaHostParser } from '../MangaHost/MangaHostParser'

export const MangaHostR18Info: SourceInfo = {
  version: '1.0.0',
  name: 'MangaHost R18',
  icon: 'icon.png',
  author: 'chiraitori',
  authorWebsite: 'https://github.com/chiraitori',
  description: 'Extension đọc manga R18 từ MangaHost API',
  contentRating: ContentRating.ADULT,
  websiteBaseURL: 'https://r18.rinka.id.vn/api/v1'
}

export class MangaHostR18 extends Source {
  private apiBase: string = MangaHostR18Info.websiteBaseURL.replace(/\/$/, '')
  private mangaCache?: { id: string; expiresAt: number; json: any }

  requestManager = App.createRequestManager({
    requestsPerSecond: 2,
    requestTimeout: 30000
  })

  private async getMangaResponse(mangaId: string): Promise<any> {
    if (this.mangaCache?.id === mangaId && this.mangaCache.expiresAt > Date.now()) {
      return this.mangaCache.json
    }

    const request = App.createRequest({
      url: `${this.apiBase}/manga/${mangaId}`,
      method: 'GET'
    })
    const response = await this.requestManager.schedule(request, 3)
    const json = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    this.mangaCache = { id: mangaId, expiresAt: Date.now() + 10000, json }
    return json
  }

  override async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const json = await this.getMangaResponse(mangaId)
    return MangaHostParser.parseMangaDetails(json, mangaId, App)
  }

  override async getChapters(mangaId: string): Promise<Chapter[]> {
    const json = await this.getMangaResponse(mangaId)
    return MangaHostParser.parseChapterList(json, mangaId, App, 'MangaHost R18')
  }

  override async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
    const request = App.createRequest({
      url: `${this.apiBase}/chapter/${chapterId}`,
      method: 'GET'
    })

    const response = await this.requestManager.schedule(request, 3)
    const json = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    return MangaHostParser.parseChapterDetails(json, mangaId, chapterId, App)
  }

  override async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
    const page = metadata?.page ?? 1
    const searchTitle = query?.title ?? ''

    const request = App.createRequest({
      url: `${this.apiBase}/manga?q=${encodeURIComponent(searchTitle)}&page=${page}&limit=20`,
      method: 'GET'
    })

    const response = await this.requestManager.schedule(request, 3)
    const json = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    return MangaHostParser.parseSearchResults(json, App)
  }

  override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
    const featuredSection = App.createHomeSection({
      id: 'featured',
      title: 'Truyện Nổi Bật',
      type: 'featured',
      containsMoreItems: false
    })

    const latestSection = App.createHomeSection({
      id: 'latest',
      title: 'Mới Cập Nhật',
      type: 'singleRowNormal',
      containsMoreItems: true
    })

    const popularSection = App.createHomeSection({
      id: 'popular',
      title: 'Xem Nhiều Nhất',
      type: 'singleRowNormal',
      containsMoreItems: true
    })

    try {
      const request = App.createRequest({
        url: `${this.apiBase}/home`,
        method: 'GET'
      })
      const response = await this.requestManager.schedule(request, 3)
      const json = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      const data = json.data

      if (data?.featured && data.featured.length > 0) {
        featuredSection.items = data.featured.map((m: any) =>
          App.createPartialSourceManga({
            mangaId: m.slug || m.id,
            image: m.coverUrl || '',
            title: m.title,
            subtitle: m.lastChapterNumber !== undefined ? `Ch. ${m.lastChapterNumber}` : undefined
          })
        )
        sectionCallback(featuredSection)
      }

      if (data?.latest && data.latest.length > 0) {
        latestSection.items = data.latest.map((m: any) =>
          App.createPartialSourceManga({
            mangaId: m.slug || m.id,
            image: m.coverUrl || '',
            title: m.title,
            subtitle: m.lastChapterNumber !== undefined ? `Ch. ${m.lastChapterNumber}` : undefined
          })
        )
        sectionCallback(latestSection)
      }

      if (data?.popular && data.popular.length > 0) {
        popularSection.items = data.popular.map((m: any) =>
          App.createPartialSourceManga({
            mangaId: m.slug || m.id,
            image: m.coverUrl || '',
            title: m.title,
            subtitle: m.lastChapterNumber !== undefined ? `Ch. ${m.lastChapterNumber}` : undefined
          })
        )
        sectionCallback(popularSection)
      }
    } catch (err) {
      console.error('Error fetching home sections:', err)
    }
  }

  override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
    const page = metadata?.page ?? 1
    let sortBy = 'updatedAt'
    if (homepageSectionId === 'popular') {
      sortBy = 'views'
    }

    const request = App.createRequest({
      url: `${this.apiBase}/manga?sort=${sortBy}&page=${page}&limit=20`,
      method: 'GET'
    })

    const response = await this.requestManager.schedule(request, 3)
    const json = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    return MangaHostParser.parseSearchResults(json, App)
  }
}
