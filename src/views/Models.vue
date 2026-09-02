<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Models</h1>
        <p v-if="lastUpdated" class="text-xs text-gray-500 mt-1">Updated {{ lastUpdated }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">{{ filteredModels.length }} / {{ models.length }} models</span>
        <HelpPanel title="Models — column definitions" :fields="HELP_FIELDS" />
      </div>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <div v-else>
      <!-- Filters -->
      <div class="mb-4 flex flex-wrap gap-3 items-center">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in providers" :key="p"
            @click="toggleProvider(p)"
            :class="selectedProviders.has(p) ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize"
          >{{ p }}</button>
        </div>
        <div class="h-4 w-px bg-gray-700" />
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="a in ACCESS_OPTIONS" :key="a.key"
            @click="selectedAccess = selectedAccess === a.key ? null : a.key"
            :class="selectedAccess === a.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >{{ a.label }}</button>
        </div>
        <div class="h-4 w-px bg-gray-700" />
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="m in modalities" :key="m"
            @click="toggleModality(m)"
            :class="selectedModalities.has(m) ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >{{ m }}</button>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-xs text-gray-600 hover:text-white transition-colors ml-1"
        >✕ clear</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th class="pb-3 pr-4">Model</th>
              <th class="pb-3 pr-4">Provider</th>
              <th class="pb-3 pr-4">Access</th>
              <th class="pb-3 pr-4">Params</th>
              <th class="pb-3 pr-4">Context</th>
              <th class="pb-3 pr-4">Modalities</th>
              <th class="pb-3 pr-4">License</th>
              <th class="pb-3 pr-4">HF Downloads</th>
              <th class="pb-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/50">
            <tr v-for="m in filteredModels" :key="m.id" class="hover:bg-gray-900/50 transition-colors">
              <td class="py-3 pr-4">
                <div class="font-medium text-white">{{ m.name }}</div>
                <div class="text-xs text-gray-500">{{ m.id }}</div>
              </td>
              <td class="py-3 pr-4 capitalize">{{ m.provider }}</td>
              <td class="py-3 pr-4">
                <span :class="accessClass(m.access)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ m.access }}
                </span>
              </td>
              <td class="py-3 pr-4 text-gray-400">{{ m.parameters ?? '—' }}</td>
              <td class="py-3 pr-4 text-gray-400">{{ formatContext(m.context_window) }}</td>
              <td class="py-3 pr-4">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="mod in m.modalities" :key="mod"
                    class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                    {{ mod }}
                  </span>
                </div>
              </td>
              <td class="py-3 pr-4 text-gray-400 text-xs">{{ m.license }}</td>
              <td class="py-3 pr-4 text-gray-400">{{ m.hf_downloads != null ? formatNum(m.hf_downloads) : '—' }}</td>
              <td class="py-3">
                <span :class="statusClass(m.status)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ m.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HelpPanel from '../components/HelpPanel.vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const ACCESS_OPTIONS = [
  { key: 'api-only', label: 'API only' },
  { key: 'both',     label: 'Open weight' },
]

const HELP_FIELDS = [
  { name: 'Model', description: 'Name and unique identifier of the model. The ID is used to reference it in APIs and deployments.' },
  { name: 'Provider', description: 'Company or organization that created and maintains the model (e.g. OpenAI, Anthropic, Meta).' },
  {
    name: 'Access',
    description: 'How the model can be used.',
    values: [
      { label: 'api-only',    class: 'bg-purple-900/50 text-purple-300', desc: 'Only available via paid API. Weights not public.' },
      { label: 'open-weight', class: 'bg-green-900/50 text-green-300',  desc: 'Weights are publicly available. Can be run locally or self-hosted.' },
      { label: 'both',        class: 'bg-blue-900/50 text-blue-300',    desc: 'Available via API and as downloadable weights.' },
    ],
  },
  { name: 'Params', description: 'Number of parameters (e.g. 7B, 70B, 671B). Larger = more capable but more expensive to run. MoE models activate only a fraction per token.' },
  { name: 'Context', description: 'Maximum context window — total tokens (input + output) the model can process in one request. 128K ≈ 100,000 words.' },
  {
    name: 'Modalities',
    description: 'Types of input/output the model supports.',
    values: [
      { label: 'text',   desc: 'Processes and generates text.' },
      { label: 'code',   desc: 'Optimized for code generation and understanding.' },
      { label: 'vision', desc: 'Can process images as input.' },
      { label: 'audio',  desc: 'Can process or generate audio.' },
    ],
  },
  {
    name: 'License',
    description: 'Usage license.',
    values: [
      { label: 'proprietary', desc: 'Closed license. Usage governed by provider ToS.' },
      { label: 'apache-2.0',  desc: 'Permissive open source. Commercial use allowed.' },
      { label: 'llama3',      desc: "Meta's custom license. Commercial use allowed under conditions." },
      { label: 'mit',         desc: 'Permissive open source. Minimal restrictions.' },
    ],
  },
  { name: 'HF Downloads', description: 'Monthly downloads from HuggingFace Hub. Proxy for community adoption. Updated daily.' },
  {
    name: 'Status',
    description: 'Current lifecycle status of the model.',
    values: [
      { label: 'active',     class: 'bg-green-900/50 text-green-300',  desc: 'Actively maintained and recommended for use.' },
      { label: 'preview',    class: 'bg-yellow-900/50 text-yellow-300', desc: 'Early access. API or weights may change.' },
      { label: 'deprecated', class: 'bg-red-900/50 text-red-300',      desc: 'No longer recommended. May be removed.' },
    ],
  },
]

const models = ref([])
const loading = ref(true)
const error = ref(null)
const lastUpdated = ref(null)
const providers = ref([])
const modalities = ref([])
const selectedProviders = ref(new Set())
const selectedModalities = ref(new Set())
const selectedAccess = ref(null)

const hasActiveFilters = computed(() =>
  selectedAccess.value !== null ||
  selectedModalities.value.size > 0 ||
  selectedProviders.value.size < providers.value.length
)

const filteredModels = computed(() =>
  models.value.filter(m => {
    if (!selectedProviders.value.has(m.provider)) return false
    if (selectedAccess.value && m.access !== selectedAccess.value) return false
    if (selectedModalities.value.size > 0) {
      const mods = m.modalities ?? []
      if (![...selectedModalities.value].every(mod => mods.includes(mod))) return false
    }
    return true
  })
)

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/models.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    models.value = data.models
    lastUpdated.value = new Date(data.lastUpdated).toLocaleString()
    providers.value = [...new Set(data.models.map(m => m.provider))].sort()
    modalities.value = [...new Set(data.models.flatMap(m => m.modalities ?? []))].sort()
    selectedProviders.value = new Set(providers.value)
  } catch (e) {
    error.value = `Failed to load models: ${e.message}`
  } finally {
    loading.value = false
  }
})

function toggleProvider(p) {
  const s = new Set(selectedProviders.value)
  s.has(p) ? s.delete(p) : s.add(p)
  selectedProviders.value = s
}

function toggleModality(m) {
  const s = new Set(selectedModalities.value)
  s.has(m) ? s.delete(m) : s.add(m)
  selectedModalities.value = s
}

function clearFilters() {
  selectedProviders.value = new Set(providers.value)
  selectedModalities.value = new Set()
  selectedAccess.value = null
}

function formatContext(n) {
  if (!n) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  return `${(n / 1000).toFixed(0)}K`
}

function formatNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n
}

function accessClass(access) {
  return {
    'api-only':    'bg-purple-900/50 text-purple-300',
    'open-weight': 'bg-green-900/50 text-green-300',
    'both':        'bg-blue-900/50 text-blue-300',
  }[access] ?? 'bg-gray-800 text-gray-300'
}

function statusClass(status) {
  return {
    'active':     'bg-green-900/50 text-green-300',
    'deprecated': 'bg-red-900/50 text-red-300',
    'preview':    'bg-yellow-900/50 text-yellow-300',
  }[status] ?? 'bg-gray-800 text-gray-300'
}
</script>
