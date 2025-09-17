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
  audioFile: AudioFile
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
