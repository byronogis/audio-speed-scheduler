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
      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in playlist"
          :key="item.id"
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          :class="{ 'inset-ring-2 inset-ring-primary': currentPlayingIndex === index }"
        >
          <div class="flex items-center gap-2 text-sm text-gray-500">
            {{ index + 1 }}
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ item.audioFile.name }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <!-- 播放速度调节 -->
            <UInputNumber
              :model-value="item.playbackRate"
              :step="0.1"
              :min="0.5"
              :max="3.0"
              size="sm"
              class="w-22"
              @update:model-value="(value) => $emit('updatePlaybackRate', item.id, value)"
            />

            <!-- 移动按钮 -->
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

            <!-- 删除按钮 -->
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              @click="$emit('removeItem', item.id)"
            />
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
import type { PlaylistItem, PlayMode } from '~/types/audio'

// Props
interface Props {
  playlist: PlaylistItem[]
  currentPlayingIndex: number
}

defineProps<Props>()

// Emits
defineEmits<{
  adjustPlaybackRate: [itemId: string, delta: number]
  updatePlaybackRate: [itemId: string, newRate: string | number]
  moveItem: [fromIndex: number, direction: number]
  removeItem: [itemId: string]
  clearPlaylist: []
  shufflePlaylist: []
}>()

const playMode = defineModel<PlayMode>('playMode')

// 使用播放模式 composable
const { playModeOptions, getPlayModeIcon } = usePlayModes()
</script>
