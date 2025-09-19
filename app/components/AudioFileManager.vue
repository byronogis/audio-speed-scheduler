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
      <UFileUpload
        v-model="uploadedFiles"
        multiple
        accept="audio/*"
        icon="i-lucide-music"
        :label="$t('audioFileManager.upload.dragDrop')"
        :description="$t('audioFileManager.upload.supportedFormats')"
        class="min-h-48"
        :ui="{
          base: 'border-2 border-dashed'
        }"
        @change="handleFileUpload"
      />

      <!-- 已上传的音频文件列表 -->
      <div v-if="audioFiles.length > 0" class="space-y-2">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ $t('audioFileManager.fileList.title') }}</h3>
        <div class="space-y-3 max-h-60 overflow-y-auto">
          <div
            v-for="file in audioFiles"
            :key="file.id"
            class="space-y-0"
          >
            <!-- 文件信息行 -->
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800" :class="getFileInfoRowClass(file)">
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
                  @click="handleAddToPlaylist(file)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  color="error"
                  size="sm"
                  @click="removeFile(file.id)"
                />
                <UButton
                  :icon="isSpeedConfigExpanded(file.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  variant="ghost"
                  size="sm"
                  @click="toggleSpeedConfig(file.id)"
                />
              </div>
            </div>

            <!-- 批量添加控制行 - 使用 UCollapsible -->
            <UCollapsible :open="isSpeedConfigExpanded(file.id)">
              <template #content>
                <div class="flex flex-col gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700" :class="getSpeedConfigClass(file)">
                  <label class="text-xs text-gray-600 dark:text-gray-400">
                    {{ $t('audioFileManager.fileList.speedInputLabel') }}
                  </label>
                  <UInputTags
                    :model-value="getBatchSpeedTags(file.id)"
                    :placeholder="$t('audioFileManager.fileList.speedInputPlaceholder')"
                    size="sm"
                    @update:model-value="setBatchSpeedTags(file.id, $event)"
                  />
                  <div v-if="getBatchSpeeds(file.id).length > 0" class="text-xs text-green-600 dark:text-green-400">
                    {{ $t('audioFileManager.fileList.willAdd', { count: getBatchSpeeds(file.id).length }) }}
                  </div>
                  <div v-else class="text-xs text-gray-500">
                    {{ $t('audioFileManager.fileList.noValidSpeeds') }}
                  </div>
                </div>
              </template>
            </UCollapsible>

            <!-- 预览进度条 - 显示在正在预览的文件下方 -->
            <div
              v-if="currentPreview?.id === file.id && previewStarted"
              class="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg"
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

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  filesAdded: [files: AudioFile[]]
  fileRemoved: [fileId: string]
  preview: [file: AudioFile]
  pausePreview: []
  resetPreview: []
  addToPlaylist: [items: { audioFile: AudioFile, playbackRate: number }[]]
  previewSeekTo: [time: number]
}>()

// DOM 引用和上传状态
const uploadedFiles = ref<File[] | null>(null)

// 批量操作状态 - 每个文件的速度标签
const batchSpeedTags = ref<Record<string, string[]>>({})

// 展开/折叠状态
const expandedSpeedConfigs = ref<Record<string, boolean>>({})

// 预设常用速度值
const getDefaultSpeedTags = (): string[] => {
  return ['1.0']
}

// 展开/折叠相关方法
const isSpeedConfigExpanded = (fileId: string): boolean => {
  return expandedSpeedConfigs.value[fileId] || false
}

const toggleSpeedConfig = (fileId: string) => {
  expandedSpeedConfigs.value[fileId] = !isSpeedConfigExpanded(fileId)
}

// 获取文件信息行的样式类
const getFileInfoRowClass = (file: AudioFile): string => {
  const isExpanded = isSpeedConfigExpanded(file.id)
  const hasPreview = props.currentPreview?.id === file.id && props.previewStarted

  if (isExpanded) {
    return 'rounded-t-lg'
  } else if (hasPreview) {
    return 'rounded-t-lg'
  } else {
    return 'rounded-lg'
  }
}

// 获取速度配置区域的样式类
const getSpeedConfigClass = (file: AudioFile): string => {
  const hasPreview = props.currentPreview?.id === file.id && props.previewStarted

  if (hasPreview) {
    return '' // 如果有预览，速度配置区域不需要底部圆角
  } else {
    return 'rounded-b-lg'
  }
}

// 批量添加相关方法
const getBatchSpeedTags = (fileId: string): string[] => {
  if (!batchSpeedTags.value[fileId]) {
    // 首次获取时设置默认值
    batchSpeedTags.value[fileId] = getDefaultSpeedTags()
  }
  return batchSpeedTags.value[fileId] || []
}

const setBatchSpeedTags = (fileId: string, tags: string[]) => {
  batchSpeedTags.value[fileId] = tags
}

const getBatchSpeeds = (fileId: string): number[] => {
  const tags = getBatchSpeedTags(fileId)
  const speeds: number[] = []

  tags.forEach(tag => {
    const speed = parseFloat(tag)
    if (!isNaN(speed) && speed >= 0.5 && speed <= 3.0) {
      speeds.push(speed)
    }
  })

  return speeds
}

const handleAddToPlaylist = (audioFile: AudioFile) => {
  // 如果展开了速度配置且有有效速度，使用批量添加
  if (isSpeedConfigExpanded(audioFile.id)) {
    const speeds = getBatchSpeeds(audioFile.id)

    if (speeds.length > 0) {
      // 为每个速度创建一个播放列表项
      const items = speeds.map(speed => ({ audioFile, playbackRate: speed }))
      emit('addToPlaylist', items)
      return
    }
  }

  // 否则使用默认速度 1.0 单个添加
  emit('addToPlaylist', [{ audioFile, playbackRate: 1.0 }])
}

// 监听 audioFiles 变化，清理无效配置
watch(() => props.audioFiles, (newFiles) => {
  const existingFileIds = new Set(newFiles.map(f => f.id))

  // 清理不存在文件的配置
  const newBatchSpeedTags: Record<string, string[]> = {}
  Object.keys(batchSpeedTags.value).forEach(fileId => {
    if (existingFileIds.has(fileId)) {
      newBatchSpeedTags[fileId] = batchSpeedTags.value[fileId]!
    }
  })
  batchSpeedTags.value = newBatchSpeedTags

  // 清理展开状态
  const newExpandedStates: Record<string, boolean> = {}
  Object.keys(expandedSpeedConfigs.value).forEach(fileId => {
    if (existingFileIds.has(fileId)) {
      newExpandedStates[fileId] = expandedSpeedConfigs.value[fileId]!
    }
  })
  expandedSpeedConfigs.value = newExpandedStates
})

// 文件处理方法
const handleFileUpload = () => {
  if (uploadedFiles.value) {
    handleFiles(uploadedFiles.value)
    uploadedFiles.value = null // 清空以便下次上传
  }
}

const handleFiles = (files: File[]) => {
  const newAudioFiles: AudioFile[] = []

  files.forEach(file => {
    const audioFile: AudioFile = {
      id: generateId(),
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }
    newAudioFiles.push(audioFile)
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
