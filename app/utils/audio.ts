// 音频文件接口定义
export interface AudioFile {
  id: string
  name: string
  size: number
  url: string
  file: File
}

// 播放列表项目接口定义
export interface PlaylistItem {
  id: string
  audioFileId: AudioFile['id']
  playbackRate: number
}

// 播放模式枚举定义
export enum PlayMode {
  SINGLE = 'single',
  SEQUENTIAL = 'sequential',
  LOOP = 'loop',
  RANDOM = 'random'
}

// 播放模式选项接口
export interface PlayModeOption {
  value: PlayMode
  label: string
  icon: string
  description: string
}

/**
 * 根据 audioFileId 获取对应的 AudioFile
 * @param audioFileId 音频文件ID
 * @param audioFiles 音频文件数组
 * @returns 对应的音频文件，如果找不到则返回 null
 */
export function getAudioFileById(audioFileId: string, audioFiles: AudioFile[]): AudioFile | null {
  return audioFiles.find(file => file.id === audioFileId) || null
}

/**
 * 根据播放列表项获取对应的 AudioFile
 * @param playlistItem 播放列表项
 * @param audioFiles 音频文件数组
 * @returns 对应的音频文件，如果找不到则返回 null
 */
export function getAudioFileFromPlaylistItem(playlistItem: PlaylistItem, audioFiles: AudioFile[]): AudioFile | null {
  return getAudioFileById(playlistItem.audioFileId, audioFiles)
}

/**
 * 检查播放列表项是否有效（对应的音频文件存在）
 * @param playlistItem 播放列表项
 * @param audioFiles 音频文件数组
 * @returns 是否有效
 */
export function isPlaylistItemValid(playlistItem: PlaylistItem, audioFiles: AudioFile[]): boolean {
  return getAudioFileFromPlaylistItem(playlistItem, audioFiles) !== null
}
