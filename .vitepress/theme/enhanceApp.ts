import type { EnhanceAppContext } from 'vitepress'
import ParamTable from '../components/ParamTable.vue'

export function enhanceApp({ app }: EnhanceAppContext) {
  app.component('ParamTable', ParamTable)
}
