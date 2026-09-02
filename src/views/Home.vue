<template>
  <div class="px-6 py-16 max-w-4xl mx-auto">

    <!-- Hero -->
    <div class="mb-16">
      <h1 class="text-4xl font-bold text-white tracking-tight mb-4">bull14</h1>
      <p class="text-gray-400 text-lg leading-relaxed max-w-2xl mb-6">
        A tracker for the AI ecosystem: models, APIs, frameworks and GPU cloud pricing.
        Built for personal use first — to decide what model/API to use, how much it costs, what's new.
      </p>
      <p class="text-gray-600 text-sm italic">"Not everything that shines is intelligence."</p>
    </div>

    <!-- Live stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
      <div v-for="stat in stats" :key="stat.label"
        class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
        <div class="text-2xl font-mono font-bold text-white">
          {{ stat.loading ? '…' : stat.value }}
        </div>
        <div class="text-xs text-gray-500 mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Nav cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-16">
      <router-link v-for="card in NAV_CARDS" :key="card.path" :to="card.path"
        class="group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-4 transition-colors">
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono text-sm text-gray-400 group-hover:text-white transition-colors">{{ card.path }}</span>
          <span class="text-gray-700 group-hover:text-gray-400 transition-colors text-sm">↗</span>
        </div>
        <p class="text-xs text-gray-600">{{ card.description }}</p>
      </router-link>
    </div>

    <!-- Sources + Contribute -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">

      <!-- Data sources -->
      <div>
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Data Sources</h2>
        <div class="space-y-2">
          <div v-for="s in SOURCES" :key="s.name" class="flex items-start gap-3">
            <span class="text-xs text-gray-600 w-3 mt-0.5 shrink-0">·</span>
            <div>
              <a v-if="s.url" :href="s.url" target="_blank"
                class="text-xs text-gray-400 hover:text-white transition-colors">
                {{ s.name }} ↗
              </a>
              <span v-else class="text-xs text-gray-400">{{ s.name }}</span>
              <span class="text-xs text-gray-600 ml-2">{{ s.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contribute -->
      <div>
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contribute</h2>
        <div class="space-y-3">
          <div v-for="c in CONTRIBUTE" :key="c.action" class="flex items-start gap-3">
            <span class="text-xs text-gray-600 w-3 mt-0.5 shrink-0">·</span>
            <div>
              <div class="text-xs text-gray-400">{{ c.action }}</div>
              <div class="text-xs text-gray-600 font-mono mt-0.5">{{ c.detail }}</div>
            </div>
          </div>
          <div class="pt-2 flex gap-3">
            <a href="https://github.com/olcortesb/bull14" target="_blank"
              class="text-xs text-gray-500 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded">
              Frontend ↗
            </a>
            <a href="https://github.com/olcortesb/bull14-backend" target="_blank"
              class="text-xs text-gray-500 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded">
              Backend ↗
            </a>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const NAV_CARDS = [
  { path: '/models',    description: 'Curated models with metadata, access type, modalities and HuggingFace stats.' },
  { path: '/pricing',   description: 'Cost per token across 60+ providers. Input, output, cached and batch pricing.' },
  { path: '/tools',     description: 'Framework versions, release activity, stars and capability breakdown.' },
  { path: '/hardware',  description: 'GPU cloud pricing across 6 providers — live where APIs are available.' },
  { path: '/changelog', description: 'Daily feed of detected changes: price drops, new models, new versions.' },
  { path: '/analytics', description: 'Hype index, price trends and API vs self-host breakeven analysis.' },
]

const SOURCES = [
  { name: 'OpenRouter API',     url: 'https://openrouter.ai/api/v1/models',                    desc: '— pricing, 378 models, 61 providers' },
  { name: 'HuggingFace Hub',    url: 'https://huggingface.co/docs/hub/api',                    desc: '— downloads, likes, last modified' },
  { name: 'GitHub Releases API',url: 'https://docs.github.com/en/rest/releases',               desc: '— tool versions and release dates' },
  { name: 'PyPI / npm',         url: 'https://pypi.org',                                       desc: '— package versions and downloads' },
  { name: 'RunPod GraphQL',     url: 'https://www.runpod.io/gpu-instance/pricing',             desc: '— live GPU pricing' },
  { name: 'Vast.ai API',        url: 'https://vast.ai',                                        desc: '— live marketplace GPU offers' },
  { name: 'Curated static data',url: null,                                                     desc: '— hardware_base.yaml, tools_base.yaml' },
]

const CONTRIBUTE = [
  { action: 'Add a model',    detail: 'Edit src/models-collector/handler.py → MODELS_BASE' },
  { action: 'Add a tool',     detail: 'Edit src/tools-collector/tools_base.yaml' },
  { action: 'Add a GPU provider', detail: 'Edit src/hardware-collector/hardware_base.yaml' },
  { action: 'Report an issue', detail: 'Open an issue on GitHub' },
]

const stats = ref([
  { label: 'models tracked',   value: null, loading: true },
  { label: 'pricing models',   value: null, loading: true },
  { label: 'tools tracked',    value: null, loading: true },
  { label: 'GPU providers',    value: null, loading: true },
])

onMounted(async () => {
  const fetches = [
    fetch(`${CLOUDFRONT_URL}/data/models.json`).then(r => r.json()).then(d => d.total),
    fetch(`${CLOUDFRONT_URL}/data/pricing.json`).then(r => r.json()).then(d => d.totalModels),
    fetch(`${CLOUDFRONT_URL}/data/tools.json`).then(r => r.json()).then(d => d.total),
    fetch(`${CLOUDFRONT_URL}/data/hardware.json`).then(r => r.json()).then(d => Object.keys(d).length),
  ]
  const results = await Promise.allSettled(fetches)
  results.forEach((r, i) => {
    stats.value[i].value = r.status === 'fulfilled' ? r.value : '—'
    stats.value[i].loading = false
  })
})
</script>
