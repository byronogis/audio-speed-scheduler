<template>
  <!-- 播放控制栏 -->
  <div
    v-if="playlist.length > 0 && currentPlayingItem && currentAudioFile"
    class="bg-white dark:bg-gray-900  dark:border-gray-700"
  >
    <!-- 展开内容 -->
    <UCollapsible v-model:open="isExpanded">
      <template #content>
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <!-- 进度条 -->
          <div class="mb-3">
            <AudioProgressBar
              :current-time="currentTime"
              :duration="duration"
              @seek-to="onProgressChange"
            />
          </div>

          <!-- 详细信息 -->
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-1">
              <UIcon :name="getPlayModeIcon(props.playMode)" class="text-primary" />
              <span class="text-gray-600 dark:text-gray-400">
                {{ getPlayModeLabel(props.playMode) }}
              </span>
            </div>
            <div class="text-gray-600 dark:text-gray-400">
              {{ $t('playbackControls.playbackRate') }}: {{ currentPlayingItem.playbackRate }}x
            </div>
          </div>
        </div>
      </template>
    </UCollapsible>

    <!-- 主控制行 (始终显示) -->
    <div class="px-4 py-3">
      <div class="flex items-center gap-3">
        <!-- 左侧：播放信息 -->
        <div class="flex-1 min-w-0 flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate text-sm">
              {{ currentAudioFile.name }}
            </p>
            <p class="text-xs text-gray-500">
              {{ $t('playbackControls.playbackRate') }}: {{ currentPlayingItem.playbackRate }}x
            </p>
          </div>
        </div>

        <!-- 中间：播放控制 -->
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-skip-back"
            variant="ghost"
            size="sm"
            :disabled="!canGoPrevious"
            @click="$emit('previousTrack')"
          />
          <UButton
            :icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
            @click="$emit('togglePlayback')"
          />
          <UButton
            icon="i-lucide-skip-forward"
            variant="ghost"
            size="sm"
            :disabled="!canGoNext"
            @click="$emit('nextTrack')"
          />
        </div>

        <!-- 右侧：展开按钮 (位置始终固定) -->
        <div class="flex-shrink-0">
          <UButton
            icon="i-lucide-chevron-up"
            variant="ghost"
            size="sm"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': isExpanded }"
            @click="toggleExpanded"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlaylistItem, PlayMode, AudioFile } from '~/utils/audio'
import { getAudioFileById } from '~/utils/audio'
import AudioProgressBar from './AudioProgressBar.vue'

// Props
interface Props {
  playlist: PlaylistItem[]
  audioFiles: AudioFile[]
  currentPlayingItem: PlaylistItem | null
  playMode: PlayMode
  isPlaying: boolean
  currentTime: number
  duration: number
  canGoPrevious: boolean
  canGoNext: boolean
  audioElement: HTMLAudioElement | null
}

const props = defineProps<Props>()

// 展开状态
const isExpanded = ref(false)

// 切换展开状态
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 根据 audioFileId 获取对应的 AudioFile
const currentAudioFile = computed(() => {
  if (!props.currentPlayingItem) return null
  return getAudioFileById(props.currentPlayingItem.audioFileId, props.audioFiles)
})

// Emits
const emit = defineEmits<{
  togglePlayback: []
  previousTrack: []
  nextTrack: []
  seekTo: [time: number]
}>()

const { getPlayModeIcon, getPlayModeLabel } = usePlayModes()

// 进度条处理方法
const onProgressChange = (value: number | undefined) => {
  if (value !== undefined) {
    emit('seekTo', value)
  }
}
</script>
