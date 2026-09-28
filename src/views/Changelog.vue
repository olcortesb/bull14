<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Changelog</h1>
        <p v-if="meta" class="text-xs text-gray-500 mt-1">
          {{ meta.total }} changes · last {{ meta.window_days }} days · generated {{ meta.generated }}
        </p>
      </div>
      <HelpPanel title="Changelog — field definitions" :fields="HELP_FIELDS" />
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-gray-800">
        <button v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          :class="activeTab === tab.key
            ? 'border-b-2 border-white text-white'
            : 'text-gray-500 hover:text-gray-300'"
          class="px-4 py-2 text-sm font-medium transition-colors -mb-px">
          {{ tab.label }}
          <span class="ml-1.5 text-xs opacity-50">{{ tab.count }}</span>
        </button>
      </div>

      <!-- PRICING TAB -->
      <div v-if="activeTab === 'pricing'">
        <!-- Model selector -->
        <div class="mb-4 flex flex-wrap gap-1.5">
          <button v-for="m in pricingModels" :key="m"
            @click="toggleModel(m)"
            :class="selectedModels.has(m) ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors">
            {{ m }}
          </button>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="model in visibleModels" :key="model"
            class="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div class="text-sm font-medium text-gray-200 mb-3">{{ model }}</div>
            <Line :data="chartData(model)" :options="chartOptions" class="max-h-40" />
            <!-- Latest change summary -->
            <div v-if="pricingTrends[model]?.[0]" class="mt-3 flex items-center gap-3 text-xs">
              <span class="text-gray-600">{{ pricingTrends[model][0].date }}</span>
              <span class="text-gray-500 font-mono line-through">${{ pricingTrends[model][0].prev?.toFixed(4) }}</span>
              <span class="text-gray-400">→</span>
              <span :class="pricingTrends[model][0].now < pricingTrends[model][0].prev ? 'text-green-400' : 'text-red-400'" class="font-mono">
                ${{ pricingTrends[model][0].now?.toFixed(4) }}
              </span>
              <span :class="pricingTrends[model][0].now < pricingTrends[model][0].prev ? 'text-green-600' : 'text-red-600'" class="ml-auto">
                {{ pricingTrends[model][0].now < pricingTrends[model][0].prev ? '↓' : '↑' }}
                {{ Math.abs(pricingTrends[model][0].pct ?? 0).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <div v-if="visibleModels.length === 0" class="text-gray-600 text-sm py-8 text-center">
          No pricing changes in the last 30 days.
        </div>
      </div>

      <!-- HARDWARE TAB -->
      <div v-if="activeTab === 'hardware'">
        <div class="space-y-2">
          <div v-for="(item, i) in hardwareItems" :key="i"
            class="flex items-center gap-4 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800">
            <span :class="typeClass(item.type)" class="px-2 py-0.5 rounded text-xs font-medium shrink-0 w-20 text-center">
              {{ item.type === 'price_dropped' ? '↓ drop' : '↑ rise' }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-200">{{ item.gpu_type }}</div>
              <div class="text-xs text-gray-500">{{ item.provider }}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-mono" :class="item.price_now < item.price_prev ? 'text-green-400' : 'text-red-400'">
                ${{ item.price_now?.toFixed(3) }}/hr
              </div>
              <div class="text-xs text-gray-600 font-mono line-through">${{ item.price_prev?.toFixed(3) }}/hr</div>
            </div>
            <div :class="item.price_now < item.price_prev ? 'text-green-600' : 'text-red-600'"
              class="text-sm font-medium shrink-0 w-16 text-right">
              {{ item.price_now < item.price_prev ? '↓' : '↑' }}
              {{ Math.abs(((item.price_now - item.price_prev) / item.price_prev) * 100).toFixed(1) }}%
            </div>
            <div class="text-xs text-gray-600 shrink-0 w-20 text-right">{{ item.date }}</div>
          </div>
        </div>
        <div v-if="hardwareItems.length === 0" class="text-gray-600 text-sm py-8 text-center">
          No hardware price changes detected.
        </div>
      </div>

      <!-- MODELS TAB -->
      <div v-if="activeTab === 'models'">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="(item, i) in modelsItems" :key="i"
            class="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <span :class="typeClass(item.type)" class="px-2 py-0.5 rounded text-xs font-medium shrink-0">
                {{ typeLabel(item.type) }}
              </span>
              <span class="text-xs text-gray-600">{{ item.date }}</span>
            </div>
            <p class="text-sm text-gray-200">{{ item.detail || item.model_id }}</p>
            <a v-if="item.url" :href="item.url" target="_blank"
              class="inline-block mt-2 text-xs text-gray-500 hover:text-gray-300">↗ details</a>
          </div>
        </div>
        <div v-if="modelsItems.length === 0" class="text-gray-600 text-sm py-8 text-center">
          No model changes detected yet.
        </div>
      </div>

      <!-- TOOLS TAB -->
      <div v-if="activeTab === 'tools'">
        <div class="space-y-2">
          <div v-for="(item, i) in toolsItems" :key="i"
            class="flex items-center gap-4 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800">
            <span :class="typeClass(item.type)" class="px-2 py-0.5 rounded text-xs font-medium shrink-0 w-20 text-center">
              {{ typeLabel(item.type) }}
            </span>
            <div class="flex-1 text-sm text-gray-200">{{ item.detail || item.tool_id }}</div>
            <a v-if="item.url" :href="item.url" target="_blank" class="text-xs text-gray-600 hover:text-gray-400">↗</a>
            <span class="text-xs text-gray-600 shrink-0">{{ item.date }}</span>
          </div>
        </div>
        <div v-if="toolsItems.length === 0" class="text-gray-600 text-sm py-8 text-center">
          No tool changes detected yet.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
} from 'chart.js'
import HelpPanel from '../components/HelpPanel.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

import { getChangelog } from '../data/index.js'
const CUTOFF_DAYS = 30

const HELP_FIELDS = [
  { name: 'Pricing', description: 'Price changes detected per model/provider. Chart shows price over time (last 30 days).' },
  { name: 'Hardware', description: 'GPU cloud price changes across providers (vast.ai, RunPod, etc.).' },
  { name: 'Models', description: 'New models added or deprecated.' },
  { name: 'Tools', description: 'New versions released for AI frameworks and tools.' },
]

const allData = ref({})
const meta = ref(null)
const loading = ref(true)
const error = ref(null)
const activeTab = ref('pricing')
const selectedModels = ref(new Set())

onMounted(async () => {
  try {
    const data = await getChangelog()
    meta.value = data._meta
    allData.value = data
  } catch (e) {
    error.value = `Failed to load changelog: ${e.message}`
  } finally {
    loading.value = false
  }
})

const cutoffDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - CUTOFF_DAYS)
  return d.toISOString().slice(0, 10)
})

// Pricing trends grouped by model
const pricingTrends = computed(() => {
  const trends = {}
  const cutoff = cutoffDate.value
  for (const item of allData.value.pricing ?? []) {
    if (!['price_changed', 'price_dropped', 'price_increased', 'price_change'].includes(item.type)) continue
    if (item.date < cutoff) continue
    const detail = item.detail ?? ''
    const part = detail.split(' ')[0].replace(/^~/, '')
    const model = part.includes('/') ? part : 'unknown'
    if (model === 'unknown') continue
    if (!trends[model]) trends[model] = []
    trends[model].push({
      date: item.date,
      prev: parseFloat(item.old_value),
      now: parseFloat(item.new_value),
      pct: item.old_value ? ((parseFloat(item.new_value) - parseFloat(item.old_value)) / parseFloat(item.old_value) * 100) : null,
      field: detail.includes(' input:') ? 'input' : detail.includes(' output:') ? 'output' : null,
    })
  }
  for (const m in trends) trends[m].sort((a, b) => a.date.localeCompare(b.date))
  return trends
})

const pricingModels = computed(() => Object.keys(pricingTrends.value).sort())

const visibleModels = computed(() =>
  selectedModels.value.size > 0
    ? pricingModels.value.filter(m => selectedModels.value.has(m))
    : pricingModels.value.slice(0, 6)
)

function toggleModel(m) {
  const s = new Set(selectedModels.value)
  s.has(m) ? s.delete(m) : s.add(m)
  selectedModels.value = s
}

function chartData(model) {
  const entries = pricingTrends.value[model] ?? []
  const labels = entries.map(e => e.date.slice(5)) // MM-DD
  const values = entries.map(e => e.now)
  const isDown = values.length > 1 && values[values.length - 1] <= values[0]
  const color = isDown ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)'
  return {
    labels,
    datasets: [{
      data: values,
      borderColor: color,
      backgroundColor: isDown ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
      borderWidth: 1.5,
      pointRadius: 2,
      fill: true,
      tension: 0.3,
    }],
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: {
    label: ctx => `$${ctx.parsed.y.toFixed(4)}`
  }}},
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: '#1f2937' } },
    y: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => `$${v.toFixed(3)}` }, grid: { color: '#1f2937' } },
  },
}

const hardwareItems = computed(() =>
  (allData.value.hardware ?? [])
    .filter(i => i.date >= cutoffDate.value)
    .sort((a, b) => b.date.localeCompare(a.date))
)

const modelsItems = computed(() =>
  (allData.value.models ?? []).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
)

const toolsItems = computed(() =>
  (allData.value.tools ?? []).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
)

const tabs = computed(() => [
  { key: 'pricing',  label: 'Pricing',  count: Object.keys(pricingTrends.value).length },
  { key: 'hardware', label: 'Hardware', count: hardwareItems.value.length },
  { key: 'models',   label: 'Models',   count: modelsItems.value.length },
  { key: 'tools',    label: 'Tools',    count: toolsItems.value.length },
])

function typeLabel(type) {
  return {
    pricing_added:    '+ added',
    price_change:     '~ price',
    price_changed:    '~ price',
    price_dropped:    '↓ drop',
    price_increased:  '↑ rise',
    new_version:      '↑ version',
    model_added:      '+ model',
    model_deprecated: '✕ deprecated',
    tool_added:       '+ tool',
  }[type] ?? type
}

function typeClass(type) {
  if (['pricing_added', 'model_added', 'tool_added'].includes(type)) return 'bg-blue-900/40 text-blue-300'
  if (type === 'price_dropped') return 'bg-green-900/40 text-green-300'
  if (type === 'price_increased') return 'bg-red-900/40 text-red-300'
  if (['price_change', 'price_changed'].includes(type)) return 'bg-yellow-900/40 text-yellow-300'
  if (type === 'new_version') return 'bg-purple-900/40 text-purple-300'
  if (type === 'model_deprecated') return 'bg-red-900/40 text-red-300'
  return 'bg-gray-800 text-gray-400'
}
</script>
