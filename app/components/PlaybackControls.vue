<template>
  <UCard v-if="playlist.length > 0">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-play-circle" class="text-primary" />
        <h2 class="text-xl font-semibold">{{ $t('playbackControls.title') }}</h2>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 当前播放信息 -->
      <div v-if="currentPlayingItem" class="text-center">
        <p class="font-medium text-gray-900 dark:text-white">
          {{ currentPlayingItem.audioFile.name }}
        </p>
        <div class="flex items-center justify-center gap-4 mt-1">
          <p class="text-sm text-gray-500">
            {{ $t('playbackControls.playbackRate') }}: {{ currentPlayingItem.playbackRate }}x
          </p>
          <div class="flex items-center gap-1">
            <UIcon :name="getPlayModeIcon(props.playMode)" class="text-primary text-sm" />
            <span class="text-sm text-gray-500">
              {{ getPlayModeLabel(props.playMode) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="currentPlayingItem">
        <AudioProgressBar
          :current-time="currentTime"
          :duration="duration"
          @seek-to="onProgressChange"
        />
      </div>

      <!-- 播放控制按钮 -->
      <div class="flex items-center justify-center gap-3">
        <UButton
          icon="i-lucide-skip-back"
          variant="outline"
          :disabled="!canGoPrevious"
          @click="$emit('previousTrack')"
        />
        <UButton
          :icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
          size="lg"
          @click="$emit('togglePlayback')"
        />
        <UButton
          icon="i-lucide-skip-forward"
          variant="outline"
          :disabled="!canGoNext"
          @click="$emit('nextTrack')"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PlaylistItem, PlayMode } from '~/types/audio'
import AudioProgressBar from './AudioProgressBar.vue'

// Props
interface Props {
  playlist: PlaylistItem[]
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
