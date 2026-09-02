<template>
  <div class="px-6 py-8 max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Analytics</h1>
      <p v-if="meta" class="text-xs text-gray-500 mt-1">Generated {{ meta.generated }}</p>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>

      <!-- Hype Index -->
      <section class="mb-10">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Hype Index</h2>
        <p class="text-xs text-gray-600 mb-4">Score based on HuggingFace downloads (60%) + likes (40%). Top {{ hypeIndex.length }} models.</p>
        <div class="space-y-2">
          <div v-for="m in hypeIndex" :key="m.model_id" class="flex items-center gap-3">
            <div class="w-32 shrink-0">
              <div class="text-sm text-gray-200 truncate">{{ m.name }}</div>
              <div class="text-xs text-gray-600">{{ m.provider }}</div>
            </div>
            <div class="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                class="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all"
                :style="{ width: `${(m.hype_score / maxHype) * 100}%` }"
              />
            </div>
            <div class="w-12 text-right text-xs font-mono text-gray-400">{{ m.hype_score }}</div>
            <div class="w-20 text-right text-xs text-gray-600">{{ formatNum(m.hf_downloads) }} dl</div>
          </div>
        </div>
      </section>

      <!-- Price Trends -->
      <section class="mb-10">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Trends</h2>
        <div v-if="priceTrendEntries.length === 0" class="text-xs text-gray-600 py-4">
          No price changes detected yet. Data accumulates over time.
        </div>
        <div v-else class="space-y-3">
          <div v-for="[model, changes] in priceTrendEntries" :key="model"
            class="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3">
            <div class="text-sm font-medium text-gray-200 mb-2">{{ model }}</div>
            <div class="space-y-1">
              <div v-for="(c, i) in changes" :key="i" class="flex items-center gap-3 text-xs">
                <span class="text-gray-600 w-24 shrink-0">{{ c.date }}</span>
                <span class="text-gray-500 w-16 shrink-0">{{ c.field }}</span>
                <span class="text-gray-500 font-mono line-through">${{ c.prev?.toFixed(4) }}</span>
                <span class="text-gray-400">→</span>
                <span :class="c.now < c.prev ? 'text-green-400' : 'text-red-400'" class="font-mono">
                  ${{ c.now?.toFixed(4) }}
                </span>
                <span :class="c.now < c.prev ? 'text-green-600' : 'text-red-600'" class="ml-auto">
                  {{ c.now < c.prev ? '↓' : '↑' }} {{ pctChange(c.prev, c.now) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Breakeven -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Breakeven — API vs Self-Host</h2>
        <p class="text-xs text-gray-600 mb-4">
          At what GPU utilization does self-hosting beat the API price? Lower = self-hosting wins sooner.
          Based on cheapest H100 available.
        </p>
        <div v-if="breakeven.length === 0" class="text-xs text-gray-600 py-4">
          No breakeven data yet — requires models with API pricing in the curated list.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th class="pb-2 pr-4">Model</th>
                <th class="pb-2 pr-4 text-right">API $/1M in</th>
                <th class="pb-2 pr-4 text-right">H100 $/hr</th>
                <th class="pb-2 pr-4 text-right">Breakeven util.</th>
                <th class="pb-2">Verdict</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/50">
              <tr v-for="b in breakeven" :key="b.model_id" class="hover:bg-gray-900/50">
                <td class="py-2.5 pr-4">
                  <div class="text-gray-200">{{ b.name }}</div>
                  <div class="text-xs text-gray-600">{{ b.provider }}</div>
                </td>
                <td class="py-2.5 pr-4 text-right font-mono text-xs text-gray-400">${{ b.api_input_per_1m?.toFixed(3) }}</td>
                <td class="py-2.5 pr-4 text-right font-mono text-xs text-gray-400">${{ b.h100_price_per_hour?.toFixed(2) }}</td>
                <td class="py-2.5 pr-4 text-right font-mono text-xs" :class="utilClass(b.breakeven_utilization)">
                  {{ (b.breakeven_utilization * 100).toFixed(1) }}%
                </td>
                <td class="py-2.5 text-xs text-gray-500">{{ b.self_host_cheaper_above }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/analytics.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    error.value = `Failed to load analytics: ${e.message}`
  } finally {
    loading.value = false
  }
})

const meta = computed(() => data.value?._meta)
const hypeIndex = computed(() => data.value?.hype_index ?? [])
const breakeven = computed(() => data.value?.breakeven ?? [])
const priceTrendEntries = computed(() => Object.entries(data.value?.price_trends ?? {}))

const maxHype = computed(() => Math.max(...hypeIndex.value.map(m => m.hype_score), 1))

function formatNum(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n
}

function pctChange(prev, now) {
  if (!prev) return '—'
  return Math.abs(((now - prev) / prev) * 100).toFixed(1)
}

function utilClass(u) {
  if (u < 0.1) return 'text-green-400'
  if (u < 0.3) return 'text-yellow-400'
  return 'text-red-400'
}
</script>
