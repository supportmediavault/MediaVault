import { ffmpegManager } from './ffmpegManager';
import { fetchFile } from '@ffmpeg/util';

export async function extractAudioFromVideo(file: File, outputFormat: string = 'mp3'): Promise<Blob> {
  const ffmpeg = await ffmpegManager.load();

  const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputFileName = `input_ext_${Date.now()}.${inputExt}`;
  const outputFileName = `output_audio_${Date.now()}.${outputFormat}`;

  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  const args = [
    '-i', inputFileName,
    '-vn', // تجاهل الفيديو تماماً
    '-acodec', outputFormat === 'mp3' ? 'libmp3lame' : 'copy',
    '-b:a', '192k',
    outputFileName
  ];

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputFileName);
  
  let mimeType = 'audio/mpeg';
  if (outputFormat === 'wav') mimeType = 'audio/wav';
  else if (outputFormat === 'ogg') mimeType = 'audio/ogg';
  else if (outputFormat === 'aac') mimeType = 'audio/aac';

  const blob = new Blob([data], { type: mimeType });

  await ffmpeg.deleteFile(inputFileName);
  await ffmpeg.deleteFile(outputFileName);

  return blob;
}