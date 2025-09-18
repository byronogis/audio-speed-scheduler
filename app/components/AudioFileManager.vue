<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-upload" class="text-primary" />
        <h2 class="text-xl font-semibold">{{ $t('audioFileManager.title') }}</h2>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 文件上传区域 -->
      <div
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @click="triggerFileInput"
      >
        <UIcon name="i-lucide-music" class="mx-auto text-4xl text-gray-400 mb-2" />
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          {{ $t('audioFileManager.upload.dragDrop') }}
        </p>
        <p class="text-sm text-gray-500">
          {{ $t('audioFileManager.upload.supportedFormats') }}
        </p>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="audio/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      >

      <!-- 已上传的音频文件列表 -->
      <div v-if="audioFiles.length > 0" class="space-y-2">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ $t('audioFileManager.fileList.title') }}</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="file in audioFiles"
            :key="file.id"
            class="space-y-2"
          >
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div class="flex items-center gap-3 flex-1">
                <UIcon name="i-lucide-music" class="text-primary" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ file.name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatFileSize(file.size) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- 预览控制按钮 -->
                <template v-if="currentPreview?.id === file.id && previewStarted">
                  <!-- 预览已开始时的状态 -->
                  <template v-if="isPlaying">
                    <!-- 正在播放：显示暂停和重置按钮 -->
                    <UButton
                      icon="i-lucide-pause"
                      variant="ghost"
                      size="sm"
                      @click="$emit('pausePreview')"
                    />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      variant="ghost"
                      size="sm"
                      @click="$emit('resetPreview')"
                    />
                  </template>
                  <template v-else>
                    <!-- 暂停中：显示继续播放和重置按钮 -->
                    <UButton
                      icon="i-lucide-play"
                      variant="ghost"
                      size="sm"
                      @click="$emit('preview', file)"
                    />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      variant="ghost"
                      size="sm"
                      @click="$emit('resetPreview')"
                    />
                  </template>
                </template>
                <template v-else>
                  <!-- 初始状态：显示播放按钮 -->
                  <UButton
                    icon="i-lucide-play"
                    variant="ghost"
                    size="sm"
                    @click="$emit('preview', file)"
                  />
                </template>

                <UButton
                  icon="i-lucide-plus"
                  variant="outline"
                  size="sm"
                  :label="$t('audioFileManager.fileList.addToPlaylist')"
                  :ui="{
                    label: 'hidden sm:block'
                  }"
                  @click="$emit('addToPlaylist', file)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  color="error"
                  size="sm"
                  @click="removeFile(file.id)"
                />
              </div>
            </div>

            <!-- 预览进度条 - 显示在正在预览的文件下方 -->
            <div
              v-if="currentPreview?.id === file.id && previewStarted"
              class="ml-9 px-3"
            >
              <AudioProgressBar
                :current-time="previewCurrentTime"
                :duration="previewDuration"
                @seek-to="onPreviewProgressChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { AudioFile } from '~/utils/audio'
import AudioProgressBar from './AudioProgressBar.vue'

// Props
interface Props {
  audioFiles: AudioFile[]
  isPlaying: boolean
  currentPreview: AudioFile | null
  previewStarted: boolean
  previewCurrentTime: number
  previewDuration: number
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  filesAdded: [files: AudioFile[]]
  fileRemoved: [fileId: string]
  preview: [file: AudioFile]
  pausePreview: []
  resetPreview: []
  addToPlaylist: [file: AudioFile]
  previewSeekTo: [time: number]
}>()

// DOM 引用
const fileInput = ref<HTMLInputElement>()

// 文件处理方法
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

const handleFiles = (files: File[]) => {
  const audioMimeTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mpeg']
  const newAudioFiles: AudioFile[] = []

  files.forEach(file => {
    const fileType = file.type.toLowerCase()
    if (audioMimeTypes.some(type => fileType.includes(type.split('/')[1] || ''))) {
      const audioFile: AudioFile = {
        id: generateId(),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        file: file
      }
      newAudioFiles.push(audioFile)
    }
  })

  if (newAudioFiles.length > 0) {
    emit('filesAdded', newAudioFiles)
  }
}

const removeFile = (fileId: string) => {
  emit('fileRemoved', fileId)
}

// 预览进度条处理方法
const onPreviewProgressChange = (value: number | undefined) => {
  if (value !== undefined) {
    emit('previewSeekTo', value)
  }
}

// 工具函数
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
