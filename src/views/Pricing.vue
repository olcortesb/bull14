<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Pricing</h1>
        <p v-if="lastUpdated" class="text-xs text-gray-500 mt-1">Updated {{ lastUpdated }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">{{ filteredModels.length }} models</span>
        <HelpPanel title="Pricing — column definitions" :fields="HELP_FIELDS" />
      </div>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>
      <!-- Filters -->
      <div class="mb-4 flex flex-wrap gap-3 items-center">
        <!-- Provider filter -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="pid in mainProviders" :key="pid"
            @click="toggleProvider(pid)"
            :class="selectedProviders.has(pid)
              ? 'bg-white text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >
            {{ pid }}
          </button>
        </div>

        <div class="h-4 w-px bg-gray-700" />

        <!-- Price type -->
        <div class="flex gap-1.5">
          <button v-for="t in priceTypes" :key="t.key"
            @click="priceType = t.key"
            :class="priceType === t.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >
            {{ t.label }}
          </button>
        </div>

        <div class="h-4 w-px bg-gray-700" />

        <!-- Sort -->
        <div class="flex gap-1.5">
          <button v-for="s in sortOptions" :key="s.key"
            @click="sortBy = s.key"
            :class="sortBy === s.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th class="pb-3 pr-4">Model</th>
              <th class="pb-3 pr-4">Provider</th>
              <th class="pb-3 pr-4 text-right">Input /1M</th>
              <th class="pb-3 pr-4 text-right">Output /1M</th>
              <th class="pb-3 pr-4 text-right">Cached /1M</th>
              <th class="pb-3 text-right">Batch Input /1M</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/50">
            <tr v-for="m in filteredModels" :key="`${m.provider}-${m.id}`"
              class="hover:bg-gray-900/50 transition-colors">
              <td class="py-2.5 pr-4">
                <span class="text-white">{{ m.id }}</span>
              </td>
              <td class="py-2.5 pr-4">
                <span class="text-xs text-gray-400">{{ m.provider }}</span>
              </td>
              <td class="py-2.5 pr-4 text-right font-mono">
                <span :class="priceColor(m.pricing.standard.input_per_1m)">
                  {{ fmt(m.pricing.standard.input_per_1m) }}
                </span>
              </td>
              <td class="py-2.5 pr-4 text-right font-mono">
                <span :class="priceColor(m.pricing.standard.output_per_1m)">
                  {{ fmt(m.pricing.standard.output_per_1m) }}
                </span>
              </td>
              <td class="py-2.5 pr-4 text-right font-mono text-gray-500">
                {{ fmt(m.pricing.cached_input_per_1m) }}
              </td>
              <td class="py-2.5 text-right font-mono text-gray-500">
                {{ fmt(m.pricing.batch?.input_per_1m) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HelpPanel from '../components/HelpPanel.vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const HELP_FIELDS = [
  { name: 'Model', description: 'Model identifier as used in the provider API. Includes variant suffixes like :free, :nitro, :extended.' },
  { name: 'Provider', description: "API provider serving the model. May differ from the model creator (e.g. Groq serves Meta's Llama models)." },
  { name: 'Input /1M', description: 'Cost per 1 million input (prompt) tokens in USD. This is what you pay for the text you send to the model.' },
  { name: 'Output /1M', description: 'Cost per 1 million output (completion) tokens in USD. Typically 3–10x more expensive than input.' },
  { name: 'Cached /1M', description: 'Discounted input price when using prompt caching. Repeated prefixes are cached server-side. Typically 75–90% cheaper than standard input.' },
  { name: 'Batch Input /1M', description: 'Discounted price for asynchronous batch processing. Requests are queued and processed within 24h. Typically 50% cheaper than standard.' },
]

const allModels = ref([])
const loading = ref(true)
const error = ref(null)
const lastUpdated = ref(null)

const MAIN_PROVIDERS = ['openai', 'anthropic', 'google', 'mistralai', 'deepseek', 'groq', 'bedrock', 'together-ai', 'cohere', 'x-ai']
const mainProviders = ref(MAIN_PROVIDERS)
const selectedProviders = ref(new Set(MAIN_PROVIDERS))

const priceType = ref('all')
const priceTypes = [
  { key: 'all',    label: 'All' },
  { key: 'cached', label: 'Has Cache' },
  { key: 'batch',  label: 'Has Batch' },
]

const sortBy = ref('input')
const sortOptions = [
  { key: 'input',    label: 'Input ↑' },
  { key: 'output',   label: 'Output ↑' },
  { key: 'name',     label: 'Name' },
]

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/pricing.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    lastUpdated.value = new Date(data.lastUpdated).toLocaleString()

    // Flatten providers → models, skip ~ variants
    const flat = []
    for (const p of data.providers) {
      if (p.id.startsWith('~')) continue
      for (const m of p.models) {
        flat.push({ ...m, provider: p.id })
      }
    }
    allModels.value = flat
  } catch (e) {
    error.value = `Failed to load pricing: ${e.message}`
  } finally {
    loading.value = false
  }
})

function toggleProvider(pid) {
  const s = new Set(selectedProviders.value)
  s.has(pid) ? s.delete(pid) : s.add(pid)
  selectedProviders.value = s
}

const filteredModels = computed(() => {
  let list = allModels.value.filter(m => selectedProviders.value.has(m.provider))

  if (priceType.value === 'cached') {
    list = list.filter(m => m.pricing.cached_input_per_1m != null)
  } else if (priceType.value === 'batch') {
    list = list.filter(m => m.pricing.batch?.input_per_1m != null)
  }

  list = [...list].sort((a, b) => {
    if (sortBy.value === 'input') {
      return (a.pricing.standard.input_per_1m ?? Infinity) - (b.pricing.standard.input_per_1m ?? Infinity)
    }
    if (sortBy.value === 'output') {
      return (a.pricing.standard.output_per_1m ?? Infinity) - (b.pricing.standard.output_per_1m ?? Infinity)
    }
    return a.id.localeCompare(b.id)
  })

  return list
})

function fmt(val) {
  if (val == null) return '—'
  if (val === 0) return 'free'
  return `$${val}`
}

function priceColor(val) {
  if (val == null) return 'text-gray-600'
  if (val === 0) return 'text-green-400'
  if (val < 0.5) return 'text-green-300'
  if (val < 3) return 'text-yellow-300'
  return 'text-red-300'
}
</script>
