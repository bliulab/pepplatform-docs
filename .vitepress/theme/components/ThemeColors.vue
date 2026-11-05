<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

interface ThemeColor {
  id: string
  label: string
  light: string
  dark: string
}

const COLORS: ThemeColor[] = [
  { id: 'blue', label: 'Blue', light: '#2563eb', dark: '#1e3a8a' },
  { id: 'green', label: 'Green', light: '#16a34a', dark: '#14532d' },
  { id: 'purple', label: 'Purple', light: '#7c3aed', dark: '#4c1d95' },
  { id: 'orange', label: 'Orange', light: '#ea580c', dark: '#7c2d12' },
  { id: 'teal', label: 'Teal', light: '#0d9488', dark: '#134e4a' },
  { id: 'rose', label: 'Rose', light: '#e11d48', dark: '#881337' },
]

const STORAGE_KEY = 'pep-nav-color'
const DEFAULT_ID = 'blue'

const isOpen = ref(false)
const currentId = ref(DEFAULT_ID)
const isDark = ref(false)
const wrapper = ref<HTMLElement | null>(null)

const currentColor = computed(() => COLORS.find((c) => c.id === currentId.value) ?? COLORS[0])
const currentColorValue = computed(() =>
  isDark.value ? currentColor.value.dark : currentColor.value.light,
)

let themeObserver: MutationObserver | undefined

function applyColor(c: ThemeColor) {
  const bg = isDark.value ? c.dark : c.light
  const text = isDark.value ? '#f8fafc' : '#ffffff'
  document.documentElement.style.setProperty('--vp-nav-bg-color', bg)
  document.documentElement.style.setProperty('--pep-nav-bg-light', c.light)
  document.documentElement.style.setProperty('--pep-nav-bg-dark', c.dark)
  document.documentElement.style.setProperty('--pep-nav-text-light', text)
  document.documentElement.style.setProperty('--pep-nav-text-dark', '#f8fafc')
}

function selectColor(id: string) {
  const c = COLORS.find((x) => x.id === id)
  if (!c) return
  currentId.value = id
  applyColor(c)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
  isOpen.value = false
}

function toggle() {
  isOpen.value = !isOpen.value
}

function onDocClick(e: MouseEvent) {
  if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

function detectDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

onMounted(() => {
  isDark.value = detectDark()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && COLORS.some((c) => c.id === saved)) {
      currentId.value = saved
    }
  } catch {}
  applyColor(currentColor.value)

  themeObserver = new MutationObserver(() => {
    const wasDark = isDark.value
    isDark.value = detectDark()
    if (wasDark !== isDark.value) applyColor(currentColor.value)
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div ref="wrapper" class="theme-colors">
    <button
      type="button"
      class="theme-colors-toggle"
      :style="{ '--theme-color-current': currentColorValue }"
      @click="toggle"
      :title="'Theme color: ' + currentColor.label"
      aria-label="Select nav bar color"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
    >
      <span class="dot" />
      <svg
        class="chevron"
        :class="{ open: isOpen }"
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <Transition name="pop">
      <div v-if="isOpen" class="theme-colors-menu">
        <div class="menu-title">Nav bar color</div>
        <div class="swatches">
          <button
            v-for="c in COLORS"
            :key="c.id"
            class="swatch"
            :class="{ active: c.id === currentId }"
            :style="{ backgroundColor: isDark ? c.dark : c.light }"
            :title="c.label"
            :aria-label="'Use ' + c.label + ' nav color'"
            :aria-pressed="c.id === currentId"
            @click="selectColor(c.id)"
          >
            <svg
              v-if="c.id === currentId"
              class="check"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="3"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-colors {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 0;
  margin-left: 18px;
  padding-left: 18px;
}

.theme-colors::before {
  content: '';
  position: absolute;
  left: 0;
  width: 1px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.36);
}

.theme-colors-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 6px 0 4px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 1px 2px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.theme-colors-toggle:hover {
  background-color: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.theme-colors-toggle .dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--theme-color-current);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.18);
  display: inline-block;
}

.theme-colors-toggle .chevron {
  color: rgba(255, 255, 255, 0.9);
  transition: transform 0.18s ease;
}

.theme-colors-toggle .chevron.open {
  transform: rotate(180deg);
}

.theme-colors-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.14);
  z-index: 60;
}

.menu-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.swatch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.swatch:hover {
  transform: scale(1.1);
}

.swatch.active {
  border-color: var(--vp-c-text-1);
}

.swatch .check {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
