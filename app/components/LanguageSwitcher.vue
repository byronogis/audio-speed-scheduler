<script setup lang="ts">
// import * as locales from '@nuxt/ui/locale/'

const { locale, setLocale, locales } = useI18n()
</script>

<template>
  <USelect
    :model-value="locale"
    :items="locales"
    value-key="code"
    label-key="name"
    @update:model-value="setLocale($event)"
  />
</template>
