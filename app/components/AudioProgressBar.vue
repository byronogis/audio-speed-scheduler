<template>
  <div class="space-y-1 pb-2">
    <div class="flex items-center justify-between text-xs text-gray-500">
      <span>{{ formatTime(currentTime) }}</span>
      <span>{{ formatTime(duration) }}</span>
    </div>
    <USlider
      :model-value="currentTime"
      :min="0"
      :max="duration || 100"
      :step="0.01"
      @update:model-value="onProgressChange"
    />
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  currentTime: number
  duration: number
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  seekTo: [time: number]
}>()

// 进度条处理方法
const onProgressChange = (value: number | undefined) => {
  if (value !== undefined) {
    emit('seekTo', value)
  }
}

// 工具函数
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>
