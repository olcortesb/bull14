<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Hardware</h1>
        <p class="text-xs text-gray-500 mt-1">GPU cloud pricing — live where available</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">{{ totalOffers }} offers across {{ providerList.length }} providers</span>
        <HelpPanel title="Hardware — column definitions" :fields="HELP_FIELDS" />
      </div>
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

      <!-- Provider cards -->
      <div class="space-y-6">
        <div v-for="p in filteredProviders" :key="p.id" class="bg-gray-900 rounded-lg border border-gray-800">
          <!-- Provider header -->
          <div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="font-semibold text-white">{{ p.name }}</span>
              <span :class="categoryClass(p.category)" class="px-2 py-0.5 rounded text-xs font-medium">
                {{ categoryLabel(p.category) }}
              </span>
              <span v-if="p.source === 'live'" class="px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400">
                ● live
              </span>
              <span v-else class="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-500">
                static
              </span>
            </div>
            <a :href="p.url" target="_blank" class="text-xs text-gray-500 hover:text-white transition-colors">
              pricing ↗
            </a>
          </div>

          <!-- GPU table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
                  <th class="px-4 py-2">GPU</th>
                  <th class="px-4 py-2 text-right">VRAM</th>
                  <th class="px-4 py-2 text-right">$/hr</th>
                  <th class="px-4 py-2 text-right">Spot $/hr</th>
                  <th class="px-4 py-2">Interconnect</th>
                  <th class="px-4 py-2">Availability</th>
                  <th v-if="p.id === 'vastai'" class="px-4 py-2 text-right">Reliability</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/30">
                <tr v-for="g in p.gpus" :key="g.gpu_type" class="hover:bg-gray-800/30 transition-colors">
                  <td class="px-4 py-2.5 font-medium text-white">{{ g.gpu_type }}</td>
                  <td class="px-4 py-2.5 text-right text-gray-400 text-xs">{{ g.vram_gb }}GB</td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs" :class="priceClass(g.price_per_hour)">
                    ${{ g.price_per_hour?.toFixed(3) ?? '—' }}
                  </td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-500">
                    {{ g.price_spot != null ? `$${g.price_spot.toFixed(3)}` : '—' }}
                  </td>
                  <td class="px-4 py-2.5 text-xs text-gray-500">{{ g.interconnect ?? '—' }}</td>
                  <td class="px-4 py-2.5">
                    <span :class="availClass(g.availability)" class="px-1.5 py-0.5 rounded text-xs">
                      {{ g.availability ?? '—' }}
                    </span>
                  </td>
                  <td v-if="p.id === 'vastai'" class="px-4 py-2.5 text-right text-xs text-gray-500">
                    {{ g.reliability != null ? `${(g.reliability * 100).toFixed(1)}%` : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Provider notes -->
          <div v-if="p.notes" class="px-4 py-2 border-t border-gray-800/50 text-xs text-gray-600">
            {{ p.notes }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HelpPanel from '../components/HelpPanel.vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const HELP_FIELDS = [
  { name: 'GPU', description: 'GPU model name. H100/H200 = latest datacenter GPUs for training and inference. A100 = previous gen. RTX = consumer/prosumer grade.' },
  { name: 'VRAM', description: 'GPU memory in GB. Determines max model size you can run. Llama 70B needs ~40GB, Llama 405B needs ~200GB in fp16.' },
  {
    name: '$/hr',
    description: 'Price per GPU per hour in USD. For live providers (RunPod, Vast.ai) this reflects current market rates.',
  },
  { name: 'Spot $/hr', description: 'Interruptible/spot price. Cheaper but can be preempted. Only available on RunPod community cloud.' },
  {
    name: 'Interconnect',
    description: 'GPU-to-GPU communication fabric for multi-GPU setups.',
    values: [
      { label: 'NVLink', desc: 'NVIDIA proprietary. High bandwidth within a node. Good for inference.' },
      { label: 'InfiniBand', desc: 'High-speed network fabric. Required for large training clusters (CoreWeave, Nebius).' },
      { label: 'PCIe', desc: 'Standard bus. Lower bandwidth. Sufficient for single-GPU inference.' },
    ],
  },
  {
    name: 'Availability',
    description: 'Current stock status.',
    values: [
      { label: 'available', class: 'bg-green-900/40 text-green-400', desc: 'In stock and ready to provision.' },
      { label: 'limited', class: 'bg-yellow-900/40 text-yellow-400', desc: 'Low stock or waitlist.' },
      { label: 'unavailable', class: 'bg-red-900/40 text-red-400', desc: 'Currently out of stock.' },
    ],
  },
  { name: 'Reliability', description: 'Vast.ai only. Historical uptime ratio of the host machine (0–1). Higher = more stable.' },
  {
    name: 'Category',
    description: 'Provider tier.',
    values: [
      { label: 'marketplace', class: 'bg-orange-900/50 text-orange-300', desc: 'P2P marketplace. Cheapest prices, variable reliability (Vast.ai).' },
      { label: 'developer', class: 'bg-blue-900/50 text-blue-300', desc: 'Managed pods and serverless. Good DX (RunPod, Paperspace).' },
      { label: 'boutique_ml', class: 'bg-purple-900/50 text-purple-300', desc: 'ML-focused cloud. Reliable, no contracts (Lambda Labs, Nebius).' },
      { label: 'ultra_scale', class: 'bg-red-900/50 text-red-300', desc: 'Enterprise clusters with InfiniBand. For large training runs (CoreWeave).' },
    ],
  },
]

const data = ref({})
const loading = ref(true)
const error = ref(null)
const selectedCategory = ref('all')

const CATEGORY_LABELS = {
  marketplace: 'Marketplace',
  developer: 'Developer',
  boutique_ml: 'Boutique ML',
  ultra_scale: 'Ultra Scale',
}

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/hardware.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    error.value = `Failed to load hardware data: ${e.message}`
  } finally {
    loading.value = false
  }
})

const providerList = computed(() =>
  Object.entries(data.value).map(([id, p]) => ({ id, ...p }))
)

const totalOffers = computed(() =>
  providerList.value.reduce((sum, p) => sum + (p.gpus?.length ?? 0), 0)
)

const categories = computed(() => {
  const counts = {}
  for (const p of providerList.value) counts[p.category] = (counts[p.category] || 0) + 1
  return [
    { key: 'all', label: 'All', count: providerList.value.length },
    ...Object.entries(counts).map(([key, count]) => ({
      key, label: CATEGORY_LABELS[key] ?? key, count,
    })),
  ]
})

const filteredProviders = computed(() =>
  selectedCategory.value === 'all'
    ? providerList.value
    : providerList.value.filter(p => p.category === selectedCategory.value)
)

function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] ?? cat
}

function categoryClass(cat) {
  return {
    marketplace: 'bg-orange-900/50 text-orange-300',
    developer: 'bg-blue-900/50 text-blue-300',
    boutique_ml: 'bg-purple-900/50 text-purple-300',
    ultra_scale: 'bg-red-900/50 text-red-300',
  }[cat] ?? 'bg-gray-800 text-gray-300'
}

function priceClass(price) {
  if (price == null) return 'text-gray-600'
  if (price < 0.5) return 'text-green-400'
  if (price < 1.5) return 'text-yellow-400'
  if (price < 3.0) return 'text-orange-400'
  return 'text-red-400'
}

function availClass(avail) {
  return {
    available: 'bg-green-900/40 text-green-400',
    limited: 'bg-yellow-900/40 text-yellow-400',
    unavailable: 'bg-red-900/40 text-red-400',
    unknown: 'bg-gray-800 text-gray-500',
  }[avail] ?? 'bg-gray-800 text-gray-500'
}
</script>
