<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Models</h1>
        <p v-if="lastUpdated" class="text-xs text-gray-500 mt-1">Updated {{ lastUpdated }}</p>
      </div>
      <span class="text-sm text-gray-500">{{ models.length }} models</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>

    <!-- Error -->
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
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
          <tr v-for="m in models" :key="m.id" class="hover:bg-gray-900/50 transition-colors">
            <td class="py-3 pr-4">
              <div class="font-medium text-white">{{ m.name }}</div>
              <div class="text-xs text-gray-500">{{ m.id }}</div>
            </td>
            <td class="py-3 pr-4">
              <span class="capitalize">{{ m.provider }}</span>
            </td>
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
            <td class="py-3 pr-4 text-gray-400">
              {{ m.hf_downloads != null ? formatNum(m.hf_downloads) : '—' }}
            </td>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const models = ref([])
const loading = ref(true)
const error = ref(null)
const lastUpdated = ref(null)

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/models.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    models.value = data.models
    lastUpdated.value = new Date(data.lastUpdated).toLocaleString()
  } catch (e) {
    error.value = `Failed to load models: ${e.message}`
  } finally {
    loading.value = false
  }
})

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
    'api-only': 'bg-purple-900/50 text-purple-300',
    'open-weight': 'bg-green-900/50 text-green-300',
    'both': 'bg-blue-900/50 text-blue-300',
  }[access] ?? 'bg-gray-800 text-gray-300'
}

function statusClass(status) {
  return {
    'active': 'bg-green-900/50 text-green-300',
    'deprecated': 'bg-red-900/50 text-red-300',
    'preview': 'bg-yellow-900/50 text-yellow-300',
  }[status] ?? 'bg-gray-800 text-gray-300'
}
</script>
