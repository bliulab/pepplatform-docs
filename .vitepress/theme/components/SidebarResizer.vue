<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSidebar } from 'vitepress/theme'

const STORAGE_KEY = 'pep-sidebar-width'
const MIN_WIDTH = 160
const MAX_WIDTH = 320
const DEFAULT_WIDTH = 176
const KEYBOARD_STEP = 8

const { hasSidebar } = useSidebar()
const isDragging = ref(false)
const currentWidth = ref(DEFAULT_WIDTH)

let cleanupDrag: (() => void) | undefined

function normalizeWidth(px: number): number {
  if (!Number.isFinite(px)) return DEFAULT_WIDTH
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(px)))
}

function getCurrentWidth(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--vp-sidebar-width')
  const n = parseInt(v, 10)
  return normalizeWidth(n)
}

function setWidth(px: number) {
  const clamped = normalizeWidth(px)
  currentWidth.value = clamped
  document.documentElement.style.setProperty('--vp-sidebar-width', clamped + 'px')
}

function saveWidth() {
  try {
    localStorage.setItem(STORAGE_KEY, String(currentWidth.value))
  } catch {}
}

function startResize(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  cleanupDrag?.()
  isDragging.value = true
  const startX = e.clientX
  const startWidth = getCurrentWidth()
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'

  const onMove = (ev: PointerEvent) => {
    const diff = ev.clientX - startX
    setWidth(startWidth + diff)
  }
  const onUp = () => {
    cleanupDrag?.()
    saveWidth()
  }

  cleanupDrag = () => {
    isDragging.value = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.removeEventListener('pointercancel', onUp)
    cleanupDrag = undefined
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
  document.addEventListener('pointercancel', onUp)
}

function resetWidth() {
  setWidth(DEFAULT_WIDTH)
  saveWidth()
}

function onKeydown(e: KeyboardEvent) {
  let nextWidth: number | undefined

  if (e.key === 'ArrowLeft')
    nextWidth = currentWidth.value - (e.shiftKey ? KEYBOARD_STEP * 2 : KEYBOARD_STEP)
  if (e.key === 'ArrowRight')
    nextWidth = currentWidth.value + (e.shiftKey ? KEYBOARD_STEP * 2 : KEYBOARD_STEP)
  if (e.key === 'Home') nextWidth = MIN_WIDTH
  if (e.key === 'End') nextWidth = MAX_WIDTH

  if (nextWidth === undefined) return
  e.preventDefault()
  setWidth(nextWidth)
  saveWidth()
}

onMounted(() => {
  currentWidth.value = getCurrentWidth()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setWidth(parseInt(saved, 10))
  } catch {}
})

onBeforeUnmount(() => {
  cleanupDrag?.()
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})
</script>

<template>
  <div
    v-if="hasSidebar"
    class="sidebar-resizer"
    :class="{ dragging: isDragging }"
    role="separator"
    aria-label="Resize sidebar"
    aria-orientation="vertical"
    :aria-valuemin="MIN_WIDTH"
    :aria-valuemax="MAX_WIDTH"
    :aria-valuenow="currentWidth"
    tabindex="0"
    @pointerdown="startResize"
    @dblclick="resetWidth"
    @keydown="onKeydown"
    title="Drag to resize sidebar · Double-click to reset"
  />
</template>

<style scoped>
.sidebar-resizer {
  position: fixed;
  left: var(--vp-sidebar-width);
  top: var(--vp-nav-height);
  bottom: 0;
  width: 14px;
  transform: translateX(-50%);
  cursor: col-resize;
  z-index: 35;
  background: transparent;
  touch-action: none;
  outline: none;
}

.sidebar-resizer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
  transition: background-color 0.18s ease;
}

.sidebar-resizer::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 12px;
  bottom: 12px;
  width: 2px;
  border-radius: 999px;
  background: var(--vp-c-divider);
  opacity: 0.55;
  transform: translateX(-50%);
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease,
    width 0.18s ease;
}

.sidebar-resizer:hover::before,
.sidebar-resizer:focus-visible::before,
.sidebar-resizer.dragging::before {
  background: rgba(37, 99, 235, 0.07);
}

.sidebar-resizer:focus-visible::after,
.sidebar-resizer:hover::after {
  background: var(--vp-c-brand-1);
  box-shadow:
    0 0 0 1px var(--vp-c-bg),
    0 0 0 4px rgba(37, 99, 235, 0.16);
  opacity: 1;
  width: 3px;
}

.sidebar-resizer.dragging::after {
  background: var(--vp-c-brand-1);
  box-shadow:
    0 0 0 1px var(--vp-c-bg),
    0 0 0 5px rgba(37, 99, 235, 0.2);
  opacity: 1;
  width: 4px;
}

@media (min-width: 1440px) {
  .sidebar-resizer {
    left: calc((100vw - (var(--vp-layout-max-width) - 64px)) / 2 + var(--vp-sidebar-width) - 32px);
  }
}

@media (max-width: 959px) {
  .sidebar-resizer {
    display: none;
  }
}
</style>
