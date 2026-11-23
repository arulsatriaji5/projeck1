export type AspectRatioType = '9:16' | '1:1' | '16:9';

export type CaptionStyleType = 'hormozi' | 'neon' | 'karaoke' | 'minimal' | 'cyberpunk';

export interface CaptionItem {
  id: string;
  start: number; // in seconds relative to clip start
  end: number;
  text: string;
  highlight?: string;
  highlightWord?: string;
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
  videoSrc?: string;
  mp4Url?: string;
  thumbnailUrl?: string;
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

export interface RecipeStyleConfig {
  layout: AspectRatioType;
  autoHook: boolean;
  subtitleTemplateId: string;
  subtitleTemplateName: string;
  customInstructions: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: 'youtube' | 'local';
  createdAt: string;
  aspectRatio: AspectRatioType;
  clipsCount: number;
  topScore: number;
  thumbnailUrl: string;
  videoData: VideoData;
}

export type SubtitleAnimationType = 'pop' | 'karaoke' | 'fade' | 'none';

export interface ManualSubtitleItem {
  id: string;
  start: number;
  end: number;
  text: string;
  highlight?: string;
  highlightWord?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  highlightColor?: string;
  strokeColor: string;
  strokeWidth: number;
  shadowBlur: number;
  animation: SubtitleAnimationType;
  yOffsetPercent: number;
}

export interface ManualBlueprint {
  clip_title: string;
  start_time: number;
  end_time: number;
  duration: number;
  videoSrc: string;
  aspectRatio: AspectRatioType;
  subtitles: ManualSubtitleItem[];
}
