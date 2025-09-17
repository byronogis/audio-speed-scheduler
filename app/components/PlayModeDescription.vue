<template>
  <div class="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">{{ $t('playModeDescription.title') }}</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="mode in playModeOptions" :key="mode.value" class="flex items-start gap-3">
        <UIcon :name="mode.icon" class="text-primary mt-0.5" />
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{{ mode.label }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ mode.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { playModeOptions } = usePlayModes()

</script>
