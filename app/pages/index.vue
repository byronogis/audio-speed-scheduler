<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto p-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('app.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('app.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：音频文件管理 -->
        <div class="space-y-6">
          <AudioFileManager
            :audio-files="audioFiles"
            :is-playing="isPreviewPlaying"
            :current-preview="currentPreview"
            :preview-started="previewStarted"
            :preview-current-time="previewCurrentTime"
            :preview-duration="previewDuration"
            @files-added="onFilesAdded"
            @file-removed="onFileRemoved"
            @preview="previewAudio"
            @pause-preview="pausePreview"
            @reset-preview="resetPreview"
            @add-to-playlist="addToPlaylist"
            @preview-seek-to="previewSeekTo"
          />
        </div>

        <!-- 右侧：播放列表管理 -->
        <div class="space-y-6">
          <PlaylistManager
            v-model:play-mode="playMode"
            :playlist="playlist"
            :current-playing-index="currentPlayingIndex"
            @adjust-playback-rate="adjustPlaybackRate"
            @update-playback-rate="updatePlaybackRate"
            @move-item="movePlaylistItem"
            @remove-item="removeFromPlaylist"
            @clear-playlist="clearPlaylist"
            @shuffle-playlist="shufflePlaylist"
          />

          <PlaybackControls
            :playlist="playlist"
            :current-playing-item="currentPlayingItem ?? null"
            :play-mode="playMode"
            :is-playing="isPlaying"
            :current-time="currentTime"
            :duration="duration"
            :can-go-previous="canGoPrevious"
            :can-go-next="canGoNext"
            :audio-element="audioElement ?? null"
            @toggle-playback="togglePlayback"
            @previous-track="previousTrack"
            @next-track="nextTrack"
            @seek-to="seekTo"
          />
        </div>
      </div>

      <!-- 播放模式说明 -->
      <PlayModeDescription />

      <!-- 页面底部 - 语言切换器 -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>

    <!-- 音频元素 -->
    <audio
      ref="audioElement"
      @loadedmetadata="onAudioLoaded"
      @timeupdate="onTimeUpdate"
      @ended="onAudioEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    />

    <!-- 预览音频元素 -->
    <audio
      ref="previewAudioElement"
      @loadedmetadata="onPreviewAudioLoaded"
      @timeupdate="onPreviewTimeUpdate"
      @ended="onPreviewAudioEnded"
      @play="isPreviewPlaying = true"
      @pause="isPreviewPlaying = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { AudioFile, PlaylistItem, PlayMode } from '~/types/audio'
import { PlayMode as PlayModeEnum } from '~/types/audio'
import AudioFileManager from '~/components/AudioFileManager.vue'
import PlaylistManager from '~/components/PlaylistManager.vue'
import PlaybackControls from '~/components/PlaybackControls.vue'
import PlayModeDescription from '~/components/PlayModeDescription.vue'

// 响应式数据
const audioFiles = ref<AudioFile[]>([])
const playlist = ref<PlaylistItem[]>([])
const playMode = ref<PlayMode>(PlayModeEnum.SEQUENTIAL)

// 播放列表播放状态
const isPlaying = ref(false)
const currentPlayingIndex = ref(-1)
const currentTime = ref(0)
const duration = ref(0)

// 预览播放状态
const currentPreview = ref<AudioFile | null>(null)
const previewStarted = ref(false) // 跟踪预览是否已经开始过
const isPreviewPlaying = ref(false)
const previewCurrentTime = ref(0)
const previewDuration = ref(0)

const randomPlayHistory = ref<number[]>([]) // 随机播放历史记录

// DOM 引用
const audioElement = ref<HTMLAudioElement>()
const previewAudioElement = ref<HTMLAudioElement>()

// 计算属性
const currentPlayingItem = computed(() => {
  if (currentPlayingIndex.value >= 0 && currentPlayingIndex.value < playlist.value.length) {
    return playlist.value[currentPlayingIndex.value]
  }
  return null
})

const canGoPrevious = computed(() => {
  return currentPlayingIndex.value > 0 ||
         ([PlayModeEnum.LOOP, PlayModeEnum.RANDOM].includes(playMode.value) && playlist.value.length > 1)
})

const canGoNext = computed(() => {
  return currentPlayingIndex.value < playlist.value.length - 1 ||
         ([PlayModeEnum.LOOP, PlayModeEnum.RANDOM].includes(playMode.value) && playlist.value.length > 1)
})

// 事件处理方法
const onFilesAdded = (newFiles: AudioFile[]) => {
  audioFiles.value.push(...newFiles)
}

const onFileRemoved = (fileId: string) => {
  const fileIndex = audioFiles.value.findIndex(f => f.id === fileId)
  if (fileIndex !== -1) {
    const audioFile = audioFiles.value[fileIndex]
    if (audioFile) {
      // 撤销 URL
      URL.revokeObjectURL(audioFile.url)
      audioFiles.value.splice(fileIndex, 1)

      // 从播放列表中移除相关项目
      playlist.value = playlist.value.filter(item => item.audioFile.id !== fileId)
    }
  }
}

// 播放列表管理
const addToPlaylist = (audioFile: AudioFile) => {
  const playlistItem: PlaylistItem = {
    id: generateId(),
    audioFile: audioFile,
    playbackRate: 1.0
  }
  playlist.value.push(playlistItem)
}

const removeFromPlaylist = (itemId: string) => {
  const itemIndex = playlist.value.findIndex(item => item.id === itemId)
  if (itemIndex !== -1) {
    // 如果正在播放这个项目，停止播放
    if (currentPlayingIndex.value === itemIndex) {
      stopAudio()
    } else if (currentPlayingIndex.value > itemIndex) {
      // 调整当前播放索引
      currentPlayingIndex.value--
    }

    playlist.value.splice(itemIndex, 1)
  }
}

const movePlaylistItem = (fromIndex: number, direction: number) => {
  const toIndex = fromIndex + direction
  if (toIndex < 0 || toIndex >= playlist.value.length) return

  const item = playlist.value.splice(fromIndex, 1)[0]
  if (item) {
    playlist.value.splice(toIndex, 0, item)

    // 调整当前播放索引
    if (currentPlayingIndex.value === fromIndex) {
      currentPlayingIndex.value = toIndex
    } else if (currentPlayingIndex.value === toIndex) {
      currentPlayingIndex.value = fromIndex
    }
  }
}

const clearPlaylist = () => {
  stopAudio()
  playlist.value = []
}

const shufflePlaylist = () => {
  const wasPlaying = isPlaying.value
  const currentItem = currentPlayingItem.value

  stopAudio()

  // Fisher-Yates 洗牌算法
  for (let i = playlist.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = playlist.value[i]
    const tempJ = playlist.value[j]
    if (temp && tempJ) {
      playlist.value[i] = tempJ
      playlist.value[j] = temp
    }
  }

  // 重置随机播放历史
  randomPlayHistory.value = []

  // 如果之前在播放，找到原来的项目并继续播放
  if (currentItem) {
    const newIndex = playlist.value.findIndex(item => item.id === currentItem.id)
    if (newIndex !== -1) {
      currentPlayingIndex.value = newIndex
      if (playMode.value === PlayModeEnum.RANDOM) {
        randomPlayHistory.value = [newIndex]
      }
      if (wasPlaying) {
        nextTick(() => {
          togglePlayback()
        })
      }
    }
  }
}

// 播放速度控制
const adjustPlaybackRate = (itemId: string, delta: number) => {
  const item = playlist.value.find(item => item.id === itemId)
  if (item) {
    const newRate = Math.max(0.5, Math.min(3.0, item.playbackRate + delta))
    item.playbackRate = Math.round(newRate * 10) / 10

    // 如果这是当前播放的项目，立即应用速度变化
    if (currentPlayingItem.value?.id === itemId && audioElement.value) {
      audioElement.value.playbackRate = item.playbackRate
    }
  }
}

const updatePlaybackRate = (itemId: string, newRate: string | number) => {
  const item = playlist.value.find(item => item.id === itemId)
  if (item) {
    const rate = typeof newRate === 'string' ? parseFloat(newRate) : newRate
    if (!isNaN(rate)) {
      item.playbackRate = Math.max(0.5, Math.min(3.0, rate))

      // 如果这是当前播放的项目，立即应用速度变化
      if (currentPlayingItem.value?.id === itemId && audioElement.value) {
        audioElement.value.playbackRate = item.playbackRate
      }
    }
  }
}

// 音频播放控制 - 预览功能
const previewAudio = (audioFile: AudioFile) => {
  // 如果播放列表正在播放，暂停它
  if (isPlaying.value && audioElement.value) {
    audioElement.value.pause()
  }

  if (previewAudioElement.value) {
    if (currentPreview.value?.id === audioFile.id) {
      // 如果是同一个文件
      if (isPreviewPlaying.value) {
        // 正在播放，则暂停
        previewAudioElement.value.pause()
      } else {
        // 暂停中，则继续播放（不重新设置src）
        previewAudioElement.value.play()
      }
    } else {
      // 切换到不同的文件，重置预览状态
      previewStarted.value = false
      currentPreview.value = audioFile
      previewStarted.value = true
      previewAudioElement.value.src = audioFile.url
      previewAudioElement.value.playbackRate = 1.0
      previewAudioElement.value.play()
    }
  }
}

const pausePreview = () => {
  if (previewAudioElement.value && currentPreview.value) {
    previewAudioElement.value.pause()
  }
}

const resetPreview = () => {
  if (previewAudioElement.value && currentPreview.value) {
    previewAudioElement.value.currentTime = 0
    previewAudioElement.value.play()
  }
}

const previewSeekTo = (time: number) => {
  if (previewAudioElement.value) {
    previewAudioElement.value.currentTime = time
  }
}

// 预览音频事件处理
const onPreviewAudioLoaded = () => {
  if (previewAudioElement.value) {
    previewDuration.value = previewAudioElement.value.duration || 0
  }
}

const onPreviewTimeUpdate = () => {
  if (previewAudioElement.value) {
    previewCurrentTime.value = previewAudioElement.value.currentTime
  }
}

const onPreviewAudioEnded = () => {
  // 预览播放结束，重置状态
  previewStarted.value = false
  currentPreview.value = null
  isPreviewPlaying.value = false
  previewCurrentTime.value = 0
  previewDuration.value = 0
}

const seekTo = (time: number) => {
  if (audioElement.value) {
    audioElement.value.currentTime = time
  }
}

const togglePlayback = () => {
  if (!audioElement.value || playlist.value.length === 0) return

  // 如果预览正在播放，停止预览
  if (isPreviewPlaying.value && previewAudioElement.value) {
    previewAudioElement.value.pause()
    currentPreview.value = null
    previewStarted.value = false
  }

  if (isPlaying.value) {
    // 暂停播放
    audioElement.value.pause()
  } else {
    // 开始或继续播放
    if (currentPlayingIndex.value === -1) {
      // 还没有选择播放项目，选择第一个或随机一个
      if (playMode.value === PlayModeEnum.RANDOM) {
        getRandomTrackIndex()
      } else {
        currentPlayingIndex.value = 0
      }
    }

    const currentItem = currentPlayingItem.value
    if (currentItem) {
      // 检查是否需要设置新的音频源
      if (audioElement.value.src !== currentItem.audioFile.url) {
        // 需要切换到新的音频文件
        audioElement.value.src = currentItem.audioFile.url
        audioElement.value.playbackRate = currentItem.playbackRate
      } else {
        // 同一个文件，只需要确保播放速度正确
        audioElement.value.playbackRate = currentItem.playbackRate
      }

      audioElement.value.play()
    }
  }
}

const stopAudio = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
  isPlaying.value = false
  currentPlayingIndex.value = -1

  // 同时停止预览
  if (previewAudioElement.value) {
    previewAudioElement.value.pause()
    previewAudioElement.value.currentTime = 0
  }
  currentPreview.value = null
  previewStarted.value = false
  isPreviewPlaying.value = false
  previewCurrentTime.value = 0
  previewDuration.value = 0

  // 重置随机播放历史
  randomPlayHistory.value = []
}

const previousTrack = () => {
  if (playlist.value.length === 0) return

  if (playMode.value === PlayModeEnum.RANDOM) {
    // 随机模式：从历史记录中获取上一首
    if (randomPlayHistory.value.length > 1) {
      randomPlayHistory.value.pop() // 移除当前项
      const prevIndex = randomPlayHistory.value[randomPlayHistory.value.length - 1]
      if (prevIndex !== undefined) {
        currentPlayingIndex.value = prevIndex
      }
    } else {
      // 如果没有历史记录，随机选择一首
      getRandomTrackIndex()
    }
  } else if (currentPlayingIndex.value > 0) {
    currentPlayingIndex.value--
  } else if (playMode.value === PlayModeEnum.LOOP) {
    currentPlayingIndex.value = playlist.value.length - 1
  } else {
    return
  }

  if (isPlaying.value) {
    const currentItem = currentPlayingItem.value
    if (currentItem && audioElement.value) {
      // 停止预览
      if (previewAudioElement.value) {
        previewAudioElement.value.pause()
      }
      currentPreview.value = null
      previewStarted.value = false

      audioElement.value.src = currentItem.audioFile.url
      audioElement.value.playbackRate = currentItem.playbackRate
      audioElement.value.play()
    }
  }
}

const nextTrack = () => {
  nextTrackInternal(false)
}

const nextTrackInternal = (autoPlay: boolean = false) => {
  if (playlist.value.length === 0) return

  if (playMode.value === PlayModeEnum.RANDOM) {
    getRandomTrackIndex()
  } else if (currentPlayingIndex.value < playlist.value.length - 1) {
    currentPlayingIndex.value++
  } else if (playMode.value === PlayModeEnum.LOOP) {
    currentPlayingIndex.value = 0
  } else {
    if (playMode.value === PlayModeEnum.SINGLE) {
      // 单曲播放模式：重新播放当前歌曲
      if (isPlaying.value && audioElement.value) {
        audioElement.value.currentTime = 0
        audioElement.value.play()
      }
      return
    } else {
      // 顺序播放模式：播放结束
      stopAudio()
      return
    }
  }

  // 自动播放或当前正在播放状态时播放新的音频
  if (autoPlay || isPlaying.value) {
    const currentItem = currentPlayingItem.value
    if (currentItem && audioElement.value) {
      // 停止预览
      if (previewAudioElement.value) {
        previewAudioElement.value.pause()
      }
      currentPreview.value = null
      previewStarted.value = false

      audioElement.value.src = currentItem.audioFile.url
      audioElement.value.playbackRate = currentItem.playbackRate
      audioElement.value.play()
    }
  }
}

// 获取随机曲目索引
const getRandomTrackIndex = () => {
  if (playlist.value.length <= 1) {
    currentPlayingIndex.value = 0
    return
  }

  let randomIndex
  do {
    randomIndex = Math.floor(Math.random() * playlist.value.length)
  } while (randomIndex === currentPlayingIndex.value && playlist.value.length > 1)

  currentPlayingIndex.value = randomIndex
  randomPlayHistory.value.push(randomIndex)

  // 限制历史记录长度
  if (randomPlayHistory.value.length > 50) {
    randomPlayHistory.value = randomPlayHistory.value.slice(-25)
  }
}

// 音频事件处理
const onAudioLoaded = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration || 0
  }
}

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const onAudioEnded = () => {
  if (currentPreview.value) {
    // 预览结束
    currentPreview.value = null
    previewStarted.value = false
    isPlaying.value = false
  } else {
    // 播放列表项目结束，根据播放模式处理
    if (playMode.value === PlayModeEnum.SINGLE) {
      // 单曲播放模式：播放完当前歌曲后停止，不自动切换
      isPlaying.value = false
    } else {
      // 其他播放模式：自动播放下一首
      nextTrackInternal(true)
    }
  }
}

// 工具函数
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// 生命周期钩子
onUnmounted(() => {
  // 清理所有创建的 URL
  audioFiles.value.forEach(file => {
    URL.revokeObjectURL(file.url)
  })
})
</script>
