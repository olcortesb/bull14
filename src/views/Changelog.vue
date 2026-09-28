<template>
  <div class="px-6 py-8 max-w-5xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Changelog</h1>
        <p v-if="meta" class="text-xs text-gray-500 mt-1">
          {{ meta.total }} changes · last {{ meta.window_days }} days · generated {{ meta.generated }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">{{ filteredItems.length }} entries</span>
        <HelpPanel title="Changelog — field definitions" :fields="HELP_FIELDS" />
      </div>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>
      <!-- Filters -->
      <div class="mb-6 flex flex-wrap gap-1.5">
        <button
          v-for="f in filters" :key="f.key"
          @click="onFilter(f.key)"
          :class="selectedFilter === f.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
          class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
        >
          {{ f.label }} <span class="opacity-50">{{ f.count }}</span>
        </button>
      </div>

      <!-- Grouped by date -->
      <div class="space-y-8">
        <div v-for="group in paginatedGroups" :key="group.date">
          <!-- Date header -->
          <div class="flex items-center gap-3 mb-3">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ group.date }}</span>
            <span class="text-xs text-gray-700">{{ group.items.length }} changes</span>
            <div class="flex-1 border-t border-gray-800"></div>
          </div>

          <!-- Items -->
          <div class="space-y-1">
            <div
              v-for="(item, i) in group.items" :key="i"
              class="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-900/50 transition-colors"
            >
              <span :class="typeClass(item.type)" class="mt-0.5 px-2 py-0.5 rounded text-xs font-medium shrink-0 w-24 text-center">
                {{ typeLabel(item.type) }}
              </span>

              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200 leading-snug">{{ item.detail || formatDetail(item) }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span v-if="item.domain" :class="domainClass(item.domain)" class="text-xs px-1.5 py-0 rounded">
                    {{ item.domain }}
                  </span>
                  <a v-if="item.url" :href="item.url" target="_blank" class="text-xs text-gray-600 hover:text-gray-400">↗</a>
                </div>
              </div>

              <div v-if="item.price_prev != null && item.price_now != null" class="text-right shrink-0">
                <div class="text-xs font-mono" :class="item.price_now < item.price_prev ? 'text-green-400' : 'text-red-400'">
                  ${{ item.price_now.toFixed(3) }}
                </div>
                <div class="text-xs text-gray-600 font-mono line-through">${{ item.price_prev.toFixed(3) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-10">
        <button @click="page--" :disabled="page === 1"
          class="px-3 py-1.5 rounded text-xs bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          ← Prev
        </button>
        <span class="text-xs text-gray-500">{{ page }} / {{ totalPages }}</span>
        <button @click="page++" :disabled="page === totalPages"
          class="px-3 py-1.5 rounded text-xs bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>

      <div v-if="filteredItems.length === 0" class="text-gray-600 text-sm py-8 text-center">
        No changes for this filter.
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HelpPanel from '../components/HelpPanel.vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'
const PAGE_SIZE = 50

const HELP_FIELDS = [
  {
    name: 'Type',
    description: 'Category of change detected.',
    values: [
      { label: '+ added', class: 'bg-blue-900/40 text-blue-300', desc: 'New model, tool or pricing entry detected.' },
      { label: '↓ dropped', class: 'bg-green-900/40 text-green-300', desc: 'Price decreased.' },
      { label: '~ price', class: 'bg-yellow-900/40 text-yellow-300', desc: 'Price changed (up or down).' },
      { label: '↑ version', class: 'bg-purple-900/40 text-purple-300', desc: 'New version released for a tool or framework.' },
      { label: '✕ deprecated', class: 'bg-red-900/40 text-red-300', desc: 'Model or service marked as deprecated.' },
    ],
  },
  { name: 'Detail', description: 'Human-readable description of the change.' },
  { name: 'Date', description: 'Date the change was detected by the pipeline (UTC).' },
  { name: 'Domain', description: 'Which data domain: pricing, models, tools or hardware.' },
  { name: 'Price delta', description: 'For hardware: new price (top) and old price (strikethrough). Green = cheaper, red = more expensive.' },
]

const allItems = ref([])
const meta = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedFilter = ref('all')
const page = ref(1)

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/changelog.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    meta.value = data._meta

    const items = []
    for (const domain of ['pricing', 'models', 'tools', 'hardware']) {
      for (const item of data[domain] ?? []) {
        items.push({ ...item, domain })
      }
    }
    items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    allItems.value = items
  } catch (e) {
    error.value = `Failed to load changelog: ${e.message}`
  } finally {
    loading.value = false
  }
})

function onFilter(key) {
  selectedFilter.value = key
  page.value = 1
}

const filters = computed(() => {
  const counts = {}
  for (const item of allItems.value) {
    counts[item.domain] = (counts[item.domain] || 0) + 1
  }
  return [
    { key: 'all', label: 'All', count: allItems.value.length },
    ...Object.entries(counts).map(([key, count]) => ({ key, label: key, count })),
  ]
})

const filteredItems = computed(() =>
  selectedFilter.value === 'all'
    ? allItems.value
    : allItems.value.filter(i => i.domain === selectedFilter.value)
)

// Group by date
const groupedByDate = computed(() => {
  const groups = {}
  for (const item of filteredItems.value) {
    const d = item.date ?? 'unknown'
    if (!groups[d]) groups[d] = []
    groups[d].push(item)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
})

const totalPages = computed(() => Math.ceil(groupedByDate.value.length / PAGE_SIZE))

const paginatedGroups = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return groupedByDate.value.slice(start, start + PAGE_SIZE)
})

function formatDetail(item) {
  if (item.type === 'price_change' || item.type === 'price_dropped' || item.type === 'price_increased') {
    if (item.gpu_type) {
      const dir = item.price_now < item.price_prev ? '↓' : '↑'
      return `${item.provider} · ${item.gpu_type} price ${dir}`
    }
  }
  if (item.type === 'new_version') return `${item.tool_id ?? ''} → v${item.new_value}`
  if (item.type === 'model_added') return `${item.model_id ?? ''} added`
  return item.type ?? '—'
}

function typeLabel(type) {
  return {
    pricing_added:    '+ added',
    price_change:     '~ price',
    price_changed:    '~ price',
    price_dropped:    '↓ dropped',
    price_increased:  '↑ increased',
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

function domainClass(domain) {
  return {
    pricing:  'bg-orange-900/30 text-orange-600',
    models:   'bg-blue-900/30 text-blue-600',
    tools:    'bg-purple-900/30 text-purple-600',
    hardware: 'bg-gray-800 text-gray-500',
  }[domain] ?? 'bg-gray-800 text-gray-500'
}
</script>
