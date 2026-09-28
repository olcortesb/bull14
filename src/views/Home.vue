<template>
  <div class="px-6 py-16 max-w-4xl mx-auto">

    <!-- Hero -->
    <div class="mb-16">
      <h1 class="text-4xl font-bold text-white tracking-tight mb-4">bull14</h1>
      <p class="text-gray-400 text-lg leading-relaxed max-w-2xl mb-6">
        A tracker for the AI ecosystem: models, APIs, frameworks and GPU cloud pricing.
        Built for personal use first — to decide what model/API to use, how much it costs, what's new.
      </p>
      <p class="text-gray-600 text-sm italic">From <span class="not-italic font-mono text-gray-500">bulbullia</span> (Latin) — bubble. A reminder that not all that inflates has substance.</p>
    </div>

    <!-- Nav cards with live stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-16">
      <router-link v-for="card in navCards" :key="card.path" :to="card.path"
        class="group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-4 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-sm text-gray-400 group-hover:text-white transition-colors">{{ card.path }}</span>
          <span class="font-mono text-sm text-white">
            {{ card.loading ? '…' : card.stat }}
          </span>
        </div>
        <p class="text-xs text-gray-600">{{ card.description }}</p>
      </router-link>
    </div>

    <!-- Sources -->
    <div>
      <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Data Sources</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
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
      <div class="mt-6 flex gap-3">
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getModels, getPricing, getTools, getHardware } from '../data/index.js'

const SOURCES = [
  { name: 'HuggingFace Hub',     url: 'https://huggingface.co/docs/hub/api',        desc: '— downloads, likes, last modified' },
  { name: 'Provider pages',      url: null,                                           desc: '— pricing scraped per provider' },
  { name: 'GitHub Releases API', url: 'https://docs.github.com/en/rest/releases',    desc: '— tool versions and release dates' },
  { name: 'PyPI / npm',          url: 'https://pypi.org',                             desc: '— package versions and downloads' },
  { name: 'RunPod GraphQL',      url: 'https://www.runpod.io/gpu-instance/pricing',  desc: '— live GPU pricing' },
  { name: 'Vast.ai API',         url: 'https://vast.ai',                              desc: '— live marketplace GPU offers' },
  { name: 'Curated static data', url: null,                                           desc: '— hardware_base.yaml, tools_base.yaml' },
]

const navCards = ref([
  { path: '/models',    description: 'Curated models with metadata, access type and HuggingFace stats.', stat: null, loading: true },
  { path: '/pricing',   description: 'Cost per token across 60+ providers. Input, output, cached and batch pricing.', stat: null, loading: true },
  { path: '/tools',     description: 'Framework versions, release activity, stars and capability breakdown.', stat: null, loading: true },
  { path: '/hardware',  description: 'GPU cloud pricing across 6 providers — live where APIs are available.', stat: null, loading: true },
  { path: '/changelog', description: 'Daily feed of detected changes: price drops, new models, new versions.', stat: null, loading: false },
  { path: '/analytics', description: 'Hype index, price trends and API vs self-host breakeven analysis.', stat: null, loading: false },
  { path: '/metrics',   description: 'Pipeline health — Lambda invocations, errors and S3 file status.', stat: null, loading: false },
])

onMounted(async () => {
  const results = await Promise.allSettled([
    getModels().then(d => `${d.total} models`),
    getPricing().then(d => `${d.totalModels} models · ${d.totalProviders} providers`),
    getTools().then(d => `${d.total} tools`),
    getHardware().then(d => `${Object.keys(d).length} providers`),
  ])
  results.forEach((r, i) => {
    navCards.value[i].stat = r.status === 'fulfilled' ? r.value : '—'
    navCards.value[i].loading = false
  })
})
</script>
