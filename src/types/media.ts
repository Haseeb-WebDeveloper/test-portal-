export interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
  name?: string;
  size?: number;
}