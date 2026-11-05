<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SidebarResizer from './components/SidebarResizer.vue'
import ThemeColors from './components/ThemeColors.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ThemeColors />
    </template>
    <template #layout-bottom>
      <SidebarResizer />
    </template>
  </Layout>
</template>
