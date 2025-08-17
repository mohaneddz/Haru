export function mimeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'ogg':
      return 'audio/ogg';
    case 'flac':
      return 'audio/flac';
    case 'aac':
      return 'audio/aac';
    case 'opus':
      return 'audio/opus';
    default:
      return 'audio/*';
  }
}