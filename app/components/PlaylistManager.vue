<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-list-music" class="text-primary" />
          <h2 class="text-xl font-semibold">{{ $t('playlistManager.title') }}</h2>
        </div>
        <div class="flex items-center gap-3">
          <USelect
            v-model="playMode"
            :items="playModeOptions"
            :icon="getPlayModeIcon(playMode)"
            size="sm"
            class="w-32"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 播放列表为空时的提示 -->
      <div v-if="playlist.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-music-2" class="mx-auto text-4xl text-gray-400 mb-2" />
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('playlistManager.emptyDescription') }}
        </p>
      </div>

      <!-- 播放列表项目 -->
      <div v-else class="space-y-4">
        <!-- 播放全部按钮 -->
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-play"
            class="flex-1"
            @click="$emit('playItem', 0)"
          >
            {{ $t('playlistManager.playAll') }}
          </UButton>
        </div>

        <!-- 播放列表 -->
        <div class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in playlist"
          :key="item.id"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          :class="{ 'inset-ring-2 inset-ring-primary': currentPlayingIndex === index }"
        >
          <!-- 第一行：序号、文件名、操作按钮 -->
          <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div class="flex items-center gap-2 text-sm text-gray-500">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ getAudioFileById(item.audioFileId, props.audioFiles)?.name || '未知文件' }}
              </p>
            </div>
            <div class="flex items-center gap-2 justify-end">
              <UButton
                icon="i-lucide-play"
                variant="ghost"
                size="sm"
                @click="$emit('playItem', index)"
              />
              <UButton
                icon="i-lucide-arrow-up"
                variant="ghost"
                size="sm"
                :disabled="index === 0"
                @click="$emit('moveItem', index, -1)"
              />
              <UButton
                icon="i-lucide-arrow-down"
                variant="ghost"
                size="sm"
                :disabled="index === playlist.length - 1"
                @click="$emit('moveItem', index, 1)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="sm"
                @click="$emit('removeItem', item.id)"
              />
            </div>
          </div>
          <!-- 第二行：播放速度Slider -->
          <div class="mt-2 flex items-center gap-3">
            <span class="text-xs text-gray-500 w-10 text-right">0.5x</span>
            <USlider
              :model-value="item.playbackRate"
              :min="0.5"
              :max="3.0"
              :step="0.1"
              class="flex-1"
              @update:model-value="(val) => val !== undefined && $emit('updatePlaybackRate', item.id, val)"
            />
            <span class="text-xs text-gray-500 w-10 text-left">3.0x</span>
            <span class="ml-2 text-sm font-mono w-10 text-center">{{ item.playbackRate.toFixed(1) }}x</span>
          </div>
        </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="playlist.length > 0" class="flex items-center gap-2">
        <UButton
          variant="outline"
          class="flex-1"
          @click="$emit('clearPlaylist')"
        >
          {{ $t('playlistManager.actions.clear') }}
        </UButton>
        <UButton
          variant="outline"
          class="flex-1"
          @click="$emit('shufflePlaylist')"
        >
          {{ $t('playlistManager.actions.shuffle') }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PlaylistItem, PlayMode, AudioFile } from '~/utils/audio'
import { getAudioFileById } from '~/utils/audio'

interface Props {
  playlist: PlaylistItem[]
  audioFiles: AudioFile[]
  currentPlayingIndex: number
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  adjustPlaybackRate: [itemId: string, delta: number]
  updatePlaybackRate: [itemId: string, newRate: string | number]
  moveItem: [fromIndex: number, direction: number]
  removeItem: [itemId: string]
  clearPlaylist: []
  shufflePlaylist: []
  playItem: [index: number]
}>()

const playMode = defineModel<PlayMode>('playMode')

// 使用播放模式 composable
const { playModeOptions, getPlayModeIcon } = usePlayModes()
</script>
