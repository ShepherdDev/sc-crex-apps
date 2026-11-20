/** Response shapes from the Rock TV API. See Rock/helix/SETUP.md. */

export interface Message {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-MM-ddTHH:mm:ss, church local time
  speaker: string;
  image: string | null; // Rock path, e.g. /GetImage.ashx?Guid=...
  videoUrl: string;
  seriesId: string;
  seriesTitle: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string | null;
  messageCount: number;
  url: string;
}

export interface LiveStream {
  title: string;
  startTime: string; // HH:mm:ss
  videoUrl: string;
}

export interface UpcomingStream {
  start: string;
  title: string;
}

export type HomeRow =
  | {
      id: string;
      title: string;
      type: 'messages';
      seriesId?: string;
      items: Message[];
    }
  | {
      id: string;
      title: string;
      type: 'series';
      seeAllUrl?: string;
      items: Series[];
    };

export interface HomeResponse {
  timeZone: string;
  generatedAt: string;
  live: LiveStream | null;
  upcoming: UpcomingStream[];
  hero: Message | null;
  rows: HomeRow[];
}

export interface SeriesResponse {
  series: Series;
  messages: Message[];
}

export interface SeriesListResponse {
  title: string;
  series: Series[];
}
