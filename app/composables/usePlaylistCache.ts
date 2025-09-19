import { ref, computed, watch, readonly, type Ref } from 'vue'
import { createStorage } from 'unstorage'
import localStorageDriver from 'unstorage/drivers/localstorage'
import indexedDBDriver from 'unstorage/drivers/indexedb'
import type { AudioFile, PlaylistItem, PlayMode } from '~/utils/audio'

/**
 * IndexedDB 存储的音频文件接口
 *
 * url 不存储，在恢复时重新生成
 * file 转换为 ArrayBuffer 存储, 并命名为 fileData
 */
type StoredAudioFile = Omit<AudioFile, 'url' | 'file'> & {
  fileData: ArrayBuffer
}

/**
 * localStorage 存储的播放列表数据
 */
interface PlaylistCacheData {
  playlist: PlaylistItem[]
  currentPlayingIndex: number
  playMode: PlayMode
  currentTime: number
}

/**
 * Cache 配置参数
 */
interface UsePlaylistCacheOptions {
  audioFiles: Ref<AudioFile[]>
  playlist: Ref<PlaylistItem[]>
  currentPlayingIndex: Ref<number>
  playMode: Ref<PlayMode>
  currentTime: Ref<number>
}

/**
 * 创建音频文件存储实例
 */
const audioStorage = createStorage({
  driver: import.meta.client
    ? indexedDBDriver({
      dbName: 'AudioSpeedScheduler',
      storeName: 'audioFiles'
    })
    : undefined
})

/**
 * 创建播放列表存储实例
 */
const playlistStorage = createStorage({
  driver: import.meta.client
    ? localStorageDriver({
      base: 'audio-speed-scheduler:'
    })
    : undefined
})

export function usePlaylistCache(options: UsePlaylistCacheOptions) {
  const { audioFiles, playlist, currentPlayingIndex, playMode, currentTime } = options

  // 缓存状态
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // 缓存键名
  const AUDIO_FILES_KEY = 'audioFiles'
  const PLAYLIST_KEY = 'playlist'

  /**
   * 将 File 对象转换为 ArrayBuffer
   */
  const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 将 ArrayBuffer 转换回 File 对象
   */
  const arrayBufferToFile = (buffer: ArrayBuffer, name: string): File => {
    return new File([buffer], name, { type: 'audio/*' })
  }

  /**
   * 保存音频文件到 IndexedDB
   */
  const saveAudioFiles = async (files: AudioFile[]) => {
    try {
      const storedFiles: Record<string, StoredAudioFile> = {}

      for (const file of files) {
        const fileData = await fileToArrayBuffer(file.file)
        storedFiles[file.id] = {
          id: file.id,
          name: file.name,
          size: file.size,
          fileData,
        }
      }

      await audioStorage.setItemRaw(AUDIO_FILES_KEY, storedFiles)
      console.log('✅ 音频文件已保存到缓存')
    } catch (error) {
      console.error('❌ 保存音频文件到缓存失败:', error)
    }
  }

  /**
   * 从 IndexedDB 加载音频文件
   */
  const loadAudioFiles = async (): Promise<AudioFile[]> => {
    try {
      const storedFiles = await audioStorage.getItem<Record<string, StoredAudioFile>>(AUDIO_FILES_KEY)
      if (!storedFiles) return []

      const files: AudioFile[] = []

      for (const [, storedFile] of Object.entries(storedFiles)) {
        const file = arrayBufferToFile(storedFile.fileData, storedFile.name)
        const url = URL.createObjectURL(file)

        files.push({
          id: storedFile.id,
          name: storedFile.name,
          size: storedFile.size,
          url,
          file
        })
      }

      console.log(`✅ 从缓存加载了 ${files.length} 个音频文件`)
      return files
    } catch (error) {
      console.error('❌ 从缓存加载音频文件失败:', error)
      return []
    }
  }

  /**
   * 保存播放列表数据到 localStorage
   */
  const savePlaylistData = async (playlistData: PlaylistItem[], playingIndex: number, currentPlayMode: PlayMode, playingTime: number) => {
    try {
      const data: PlaylistCacheData = {
        playlist: playlistData,
        currentPlayingIndex: playingIndex,
        playMode: currentPlayMode,
        currentTime: playingTime
      }

      await playlistStorage.setItem(PLAYLIST_KEY, data)
      console.log('✅ 播放列表、播放模式和播放时间已保存到缓存')
    } catch (error) {
      console.error('❌ 保存播放列表到缓存失败:', error)
    }
  }

  /**
   * 从 localStorage 加载播放列表数据
   */
  const loadPlaylistData = async (): Promise<PlaylistCacheData | null> => {
    try {
      const data = await playlistStorage.getItem<PlaylistCacheData>(PLAYLIST_KEY)
      if (data) {
        console.log(`✅ 从缓存加载了播放列表，包含 ${data.playlist.length} 个项目`)
      }
      return data
    } catch (error) {
      console.error('❌ 从缓存加载播放列表失败:', error)
      return null
    }
  }

  /**
   * 清除所有缓存
   */
  const clearCache = async () => {
    try {
      await audioStorage.clear()
      await playlistStorage.clear()
      console.log('✅ 所有缓存已清除')
    } catch (error) {
      console.error('❌ 清除缓存失败:', error)
    }
  }

  /**
   * 清除音频文件缓存
   */
  const clearAudioFilesCache = async () => {
    try {
      await audioStorage.removeItem(AUDIO_FILES_KEY)
      console.log('✅ 音频文件缓存已清除')
    } catch (error) {
      console.error('❌ 清除音频文件缓存失败:', error)
    }
  }

  /**
   * 清除播放列表缓存
   */
  const clearPlaylistCache = async () => {
    try {
      await playlistStorage.removeItem(PLAYLIST_KEY)
      console.log('✅ 播放列表缓存已清除')
    } catch (error) {
      console.error('❌ 清除播放列表缓存失败:', error)
    }
  }

  /**
   * 初始化缓存 - 从缓存中恢复数据
   */
  const initializeCache = async () => {
    if (isInitialized.value) return

    isLoading.value = true

    try {
      // 加载音频文件
      const cachedAudioFiles = await loadAudioFiles()
      if (cachedAudioFiles.length > 0) {
        audioFiles.value = cachedAudioFiles
      }

      // 加载播放列表数据
      const cachedPlaylistData = await loadPlaylistData()
      if (cachedPlaylistData) {
        // 验证播放列表项的有效性（确保对应的音频文件存在）
        const validPlaylistItems = cachedPlaylistData.playlist.filter(item =>
          audioFiles.value.some(file => file.id === item.audioFileId)
        )

        playlist.value = validPlaylistItems

        // 恢复播放模式
        if (cachedPlaylistData.playMode) {
          playMode.value = cachedPlaylistData.playMode
        }

        // 恢复播放时间
        if (typeof cachedPlaylistData.currentTime === 'number' && cachedPlaylistData.currentTime >= 0) {
          currentTime.value = cachedPlaylistData.currentTime
        }

        // 验证当前播放索引
        if (cachedPlaylistData.currentPlayingIndex >= 0 &&
            cachedPlaylistData.currentPlayingIndex < validPlaylistItems.length) {
          currentPlayingIndex.value = cachedPlaylistData.currentPlayingIndex
        } else {
          currentPlayingIndex.value = -1
        }
      }

      isInitialized.value = true
      console.log('✅ 缓存初始化完成')
    } catch (error) {
      console.error('❌ 缓存初始化失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 监听音频文件变化，自动保存到缓存
  watch(
    audioFiles,
    async (newFiles) => {
      if (isInitialized.value) {
        await saveAudioFiles(newFiles)
      }
    },
    { deep: true }
  )

  // 监听播放列表、播放模式和播放时间变化，自动保存到缓存
  watch(
    [playlist, currentPlayingIndex, playMode, currentTime],
    async ([newPlaylist, newIndex, newPlayMode, newTime]) => {
      if (isInitialized.value) {
        await savePlaylistData(newPlaylist, newIndex, newPlayMode, newTime)
      }
    },
    { deep: true }
  )

  // 计算缓存统计信息
  const cacheStats = computed(() => {
    const audioFilesCount = audioFiles.value.length
    const playlistItemsCount = playlist.value.length
    const uniqueAudioFiles = new Set(playlist.value.map(item => item.audioFileId)).size

    return {
      audioFilesCount,
      playlistItemsCount,
      uniqueAudioFiles,
      spaceSaved: playlistItemsCount - uniqueAudioFiles
    }
  })

  // 自动初始化缓存
  if (import.meta.client) {
    initializeCache()
  }

  return {
    // 状态
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    cacheStats: readonly(cacheStats),

    // 方法
    initializeCache,
    clearCache,
    clearAudioFilesCache,
    clearPlaylistCache,

    // 手动保存方法（通常不需要，因为有自动监听）
    saveAudioFiles: () => saveAudioFiles(audioFiles.value),
    savePlaylistData: () => savePlaylistData(playlist.value, currentPlayingIndex.value, playMode.value, currentTime.value)
  }
}
