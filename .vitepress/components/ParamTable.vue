<script setup lang="ts">
interface Param {
  name: string
  type: string
  default: string
  choices?: string[]
  help?: string
}

defineProps<{
  params: Param[]
}>()
</script>

<template>
  <div class="param-table-wrapper">
    <table class="param-table">
      <thead>
        <tr>
          <th>参数</th>
          <th>类型</th>
          <th>默认值</th>
          <th>可选值</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in params" :key="p.name">
          <td
            ><code>{{ p.name }}</code></td
          >
          <td>{{ p.type }}</td>
          <td
            ><code>{{ p.default }}</code></td
          >
          <td>{{ p.choices ? p.choices.join(', ') : '—' }}</td>
          <td>{{ p.help || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.param-table-wrapper {
  overflow-x: auto;
  margin: 1.5rem 0;
}
.param-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.param-table th,
.param-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  text-align: left;
}
.param-table th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}
.param-table td code {
  font-size: 0.8rem;
}
</style>
