<template>
  <div class="px-6 py-8 max-w-5xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Changelog</h1>
        <p v-if="meta" class="text-xs text-gray-500 mt-1">
          {{ meta.total }} changes · last {{ meta.window_days }} days · generated {{ meta.generated }}
        </p>
      </div>
      <span class="text-sm text-gray-500">{{ filteredItems.length }} entries</span>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>
      <!-- Filters -->
      <div class="mb-4 flex flex-wrap gap-1.5">
        <button
          v-for="f in filters" :key="f.key"
          @click="selectedFilter = f.key"
          :class="selectedFilter === f.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
          class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
        >
          {{ f.label }} <span class="opacity-50">{{ f.count }}</span>
        </button>
      </div>

      <!-- Feed -->
      <div class="space-y-1">
        <div
          v-for="(item, i) in filteredItems" :key="i"
          class="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-900/50 transition-colors"
        >
          <!-- Type badge -->
          <span :class="typeClass(item.type)" class="mt-0.5 px-2 py-0.5 rounded text-xs font-medium shrink-0 w-28 text-center">
            {{ typeLabel(item.type) }}
          </span>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-200 leading-snug">{{ item.detail || formatDetail(item) }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-gray-600">{{ item.date }}</span>
              <span v-if="item.domain" :class="domainClass(item.domain)" class="text-xs px-1.5 py-0 rounded">
                {{ item.domain }}
              </span>
              <a v-if="item.url" :href="item.url" target="_blank" class="text-xs text-gray-600 hover:text-gray-400">↗</a>
            </div>
          </div>

          <!-- Price delta for hardware -->
          <div v-if="item.price_prev != null && item.price_now != null" class="text-right shrink-0">
            <div class="text-xs font-mono" :class="item.price_now < item.price_prev ? 'text-green-400' : 'text-red-400'">
              ${{ item.price_now.toFixed(3) }}
            </div>
            <div class="text-xs text-gray-600 font-mono line-through">${{ item.price_prev.toFixed(3) }}</div>
          </div>
        </div>

        <div v-if="filteredItems.length === 0" class="text-gray-600 text-sm py-8 text-center">
          No changes for this filter.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const allItems = ref([])
const meta = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedFilter = ref('all')

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/changelog.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    meta.value = data._meta

    // Flatten all domains into a single list with domain tag, sorted by date desc
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

function formatDetail(item) {
  if (item.type === 'price_change' && item.gpu_type) {
    const dir = item.price_now < item.price_prev ? '↓' : '↑'
    return `${item.provider} · ${item.gpu_type} price ${dir}`
  }
  if (item.type === 'new_version') return `${item.tool_id ?? ''} → v${item.new_value}`
  if (item.type === 'model_added') return `${item.model_id ?? ''} added`
  return item.type ?? '—'
}

function typeLabel(type) {
  return {
    pricing_added: '+ added',
    price_change: '~ price',
    price_dropped: '↓ dropped',
    new_version: '↑ version',
    model_added: '+ model',
    model_deprecated: '✕ deprecated',
    tool_added: '+ tool',
  }[type] ?? type
}

function typeClass(type) {
  if (type === 'pricing_added' || type === 'model_added' || type === 'tool_added')
    return 'bg-blue-900/40 text-blue-300'
  if (type === 'price_dropped')
    return 'bg-green-900/40 text-green-300'
  if (type === 'price_change')
    return 'bg-yellow-900/40 text-yellow-300'
  if (type === 'new_version')
    return 'bg-purple-900/40 text-purple-300'
  if (type === 'model_deprecated')
    return 'bg-red-900/40 text-red-300'
  return 'bg-gray-800 text-gray-400'
}

function domainClass(domain) {
  return {
    pricing: 'bg-gray-800 text-gray-500',
    models: 'bg-gray-800 text-gray-500',
    tools: 'bg-gray-800 text-gray-500',
    hardware: 'bg-gray-800 text-gray-500',
  }[domain] ?? 'bg-gray-800 text-gray-500'
}
</script>
