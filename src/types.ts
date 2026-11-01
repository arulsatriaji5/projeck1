export type AspectRatioType = '9:16' | '1:1' | '16:9';

export type CaptionStyleType = 'hormozi' | 'neon' | 'karaoke' | 'minimal' | 'cyberpunk';

export interface CaptionItem {
  id: string;
  start: number; // in seconds relative to clip start
  end: number;
  text: string;
  highlight?: string;
  emoji?: string;
}

export interface ClipItem {
  id: string;
  title: string;
  hook: string;
  startTime: number; // in seconds from full video
  endTime: number;
  duration: string;
  viralScore: number; // 0 - 100
  scoreReason: string;
  aspectRatio: AspectRatioType;
  category: string;
  captions: CaptionItem[];
  viewsEstimate?: string;
  engagementRating?: 'Extremely High' | 'Very High' | 'High' | 'Moderate';
}

export interface VideoData {
  videoId: string;
  videoTitle: string;
  channelName: string;
  totalDuration: string;
  thumbnailUrl: string;
  clips: ClipItem[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'captions';
  muted?: boolean;
  locked?: boolean;
}

export type MediaType = 'video' | 'image' | 'document' | 'url';

export interface ReferenceItem {
  id: string;
  title: string;
  mediaType: MediaType;
  url?: string;
  fileData?: {
    name: string;
    size: string;
    type: string;
    previewUrl?: string;
  };
  platform?: 'tiktok' | 'instagram' | 'youtube' | 'lainnya';
  category: string;
  notes: string;
  createdAt: string;
}

