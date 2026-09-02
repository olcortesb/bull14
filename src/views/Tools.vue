<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Tools</h1>
        <p v-if="lastUpdated" class="text-xs text-gray-500 mt-1">Updated {{ lastUpdated }}</p>
      </div>
      <span class="text-sm text-gray-500">{{ filteredTools.length }} tools</span>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>
      <!-- Category filter -->
      <div class="mb-4 flex flex-wrap gap-1.5">
        <button
          v-for="cat in categories" :key="cat.key"
          @click="selectedCategory = cat.key"
          :class="selectedCategory === cat.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
          class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
        >
          {{ cat.label }} <span class="opacity-50">{{ cat.count }}</span>
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th class="pb-3 pr-4">Tool</th>
              <th class="pb-3 pr-4">Category</th>
              <th class="pb-3 pr-4">Version</th>
              <th class="pb-3 pr-4">Released</th>
              <th class="pb-3 pr-4 text-right">Stars</th>
              <th class="pb-3 pr-4">License</th>
              <th class="pb-3 pr-4">Activity</th>
              <th class="pb-3">Capabilities</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/50">
            <tr v-for="t in filteredTools" :key="t.id"
              class="hover:bg-gray-900/50 transition-colors cursor-pointer"
              @click="selected = selected?.id === t.id ? null : t"
            >
              <td class="py-3 pr-4">
                <div class="font-medium text-white">{{ t.name }}</div>
                <div class="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{{ t.description }}</div>
              </td>
              <td class="py-3 pr-4">
                <span :class="categoryClass(t.category)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ t.category }}
                </span>
              </td>
              <td class="py-3 pr-4 font-mono text-gray-300 text-xs">
                {{ t.version ? `v${t.version}` : '—' }}
              </td>
              <td class="py-3 pr-4 text-gray-500 text-xs">{{ t.released ?? '—' }}</td>
              <td class="py-3 pr-4 text-right text-gray-400 text-xs">{{ formatNum(t.stars) }}</td>
              <td class="py-3 pr-4 text-gray-500 text-xs">{{ t.license ?? '—' }}</td>
              <td class="py-3 pr-4">
                <span :class="activityClass(t.activity)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ activityLabel(t.activity) }}
                </span>
              </td>
              <td class="py-3">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="cap in activeCaps(t.capabilities)" :key="cap"
                    class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400"
                    :title="cap">
                    {{ capIcon(cap) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detail panel -->
      <div v-if="selected" class="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h2 class="font-bold text-white">{{ selected.name }}</h2>
            <p class="text-sm text-gray-400 mt-1">{{ selected.description }}</p>
          </div>
          <button @click="selected = null" class="text-gray-600 hover:text-white text-lg leading-none">×</button>
        </div>
        <div class="grid grid-cols-2 gap-4 text-xs mt-4">
          <div>
            <div class="text-gray-500 mb-2 uppercase tracking-wider">Links</div>
            <div class="space-y-1">
              <a v-if="selected.github" :href="`https://github.com/${selected.github}`" target="_blank"
                class="flex items-center gap-1.5 text-gray-300 hover:text-white">
                GitHub ↗
              </a>
              <a v-if="selected.changelog_url" :href="selected.changelog_url" target="_blank"
                class="flex items-center gap-1.5 text-gray-300 hover:text-white">
                Latest release ↗
              </a>
              <span v-if="selected.pypi" class="text-gray-500">PyPI: {{ selected.pypi }}</span>
              <span v-if="selected.npm" class="text-gray-500">npm: {{ selected.npm }}</span>
            </div>
          </div>
          <div>
            <div class="text-gray-500 mb-2 uppercase tracking-wider">Stats</div>
            <div class="space-y-1 text-gray-400">
              <div>Stars: {{ formatNum(selected.stars) }}</div>
              <div>Forks: {{ formatNum(selected.forks) }}</div>
              <div>Open issues: {{ selected.open_issues ?? '—' }}</div>
              <div v-if="selected.pypi_downloads_month">PyPI/month: {{ formatNum(selected.pypi_downloads_month) }}</div>
              <div v-if="selected.npm_downloads_month">npm/month: {{ formatNum(selected.npm_downloads_month) }}</div>
              <div>Last commit: {{ selected.last_commit ?? '—' }}</div>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-gray-500 text-xs mb-2 uppercase tracking-wider">Capabilities</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="(val, cap) in selected.capabilities" :key="cap"
              :class="val ? 'bg-green-900/40 text-green-300' : 'bg-gray-800 text-gray-600'"
              class="px-2 py-0.5 rounded text-xs">
              {{ capIcon(cap) }} {{ cap.replace(/_/g, ' ') }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const tools = ref([])
const loading = ref(true)
const error = ref(null)
const lastUpdated = ref(null)
const selectedCategory = ref('all')
const selected = ref(null)

const CATEGORY_LABELS = {
  all: 'All',
  orchestration: 'Orchestration',
  runtime: 'Runtime',
  eval: 'Eval',
  observability: 'Observability',
}

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/tools.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    tools.value = data.tools
    lastUpdated.value = new Date(data.lastUpdated).toLocaleString()
  } catch (e) {
    error.value = `Failed to load tools: ${e.message}`
  } finally {
    loading.value = false
  }
})

const categories = computed(() => {
  const counts = {}
  for (const t of tools.value) counts[t.category] = (counts[t.category] || 0) + 1
  return [
    { key: 'all', label: 'All', count: tools.value.length },
    ...Object.entries(counts).map(([key, count]) => ({
      key, label: CATEGORY_LABELS[key] ?? key, count,
    })),
  ]
})

const filteredTools = computed(() =>
  selectedCategory.value === 'all'
    ? tools.value
    : tools.value.filter(t => t.category === selectedCategory.value)
)

function formatNum(n) {
  if (n == null) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n
}

function activeCaps(caps) {
  if (!caps) return []
  return Object.entries(caps).filter(([, v]) => v).map(([k]) => k)
}

const CAP_ICONS = {
  streaming: '⚡',
  async: '🔄',
  local_models: '💻',
  vision: '👁',
  function_calling: '🔧',
  stateful: '💾',
  graph_based: '🕸',
  ui: '🖥',
  self_hostable: '🏠',
  cloud_hosted: '☁️',
}

function capIcon(cap) {
  return CAP_ICONS[cap] ?? cap
}

function categoryClass(cat) {
  return {
    orchestration: 'bg-purple-900/50 text-purple-300',
    runtime: 'bg-blue-900/50 text-blue-300',
    eval: 'bg-yellow-900/50 text-yellow-300',
    observability: 'bg-green-900/50 text-green-300',
  }[cat] ?? 'bg-gray-800 text-gray-300'
}

function activityClass(activity) {
  return {
    active: 'bg-green-900/50 text-green-300',
    slow: 'bg-yellow-900/50 text-yellow-300',
    inactive: 'bg-red-900/50 text-red-300',
    unknown: 'bg-gray-800 text-gray-500',
  }[activity] ?? 'bg-gray-800 text-gray-500'
}

function activityLabel(activity) {
  return { active: '● active', slow: '● slow', inactive: '● inactive', unknown: '? unknown' }[activity] ?? activity
}
</script>
