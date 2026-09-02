<template>
  <div class="px-6 py-8 max-w-4xl mx-auto">
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Metrics</h1>
        <HelpPanel title="Metrics — definitions" :fields="HELP_FIELDS" />
      </div>
      <p v-if="meta" class="text-xs text-gray-500 mt-1">Generated {{ meta.generated }} · Lambda stats last 7 days</p>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <template v-else>

      <!-- Pipeline summary -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Invocations (7d)</div>
          <div class="text-2xl font-mono font-bold text-white">{{ pipeline.total_invocations_7d }}</div>
        </div>
        <div class="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Errors (7d)</div>
          <div class="text-2xl font-mono font-bold" :class="pipeline.total_errors_7d > 0 ? 'text-red-400' : 'text-green-400'">
            {{ pipeline.total_errors_7d }}
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">DynamoDB Items</div>
          <div class="text-2xl font-mono font-bold text-white">{{ dynamodb.item_count.toLocaleString() }}</div>
        </div>
      </div>

      <!-- Lambda functions -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Lambda Functions</h2>
        <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th class="px-4 py-2.5">Function</th>
                <th class="px-4 py-2.5 text-right">Invocations</th>
                <th class="px-4 py-2.5 text-right">Errors</th>
                <th class="px-4 py-2.5 text-right">Avg duration</th>
                <th class="px-4 py-2.5 text-right">Error rate</th>
                <th class="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/50">
              <tr v-for="fn in functions" :key="fn.name" class="hover:bg-gray-800/30 transition-colors">
                <td class="px-4 py-2.5 font-medium text-gray-200">{{ fn.name }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-400">{{ fn.invocations_7d }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-xs" :class="fn.errors_7d > 0 ? 'text-red-400' : 'text-gray-600'">
                  {{ fn.errors_7d }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-400">
                  {{ fn.avg_duration_ms ? `${fn.avg_duration_ms}ms` : '—' }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-xs" :class="fn.error_rate > 0 ? 'text-red-400' : 'text-gray-600'">
                  {{ fn.error_rate > 0 ? `${(fn.error_rate * 100).toFixed(1)}%` : '—' }}
                </td>
                <td class="px-4 py-2.5">
                  <span :class="fn.errors_7d > 0 ? 'text-red-400' : fn.invocations_7d > 0 ? 'text-green-400' : 'text-gray-600'"
                    class="text-xs">
                    {{ fn.errors_7d > 0 ? '● error' : fn.invocations_7d > 0 ? '● ok' : '○ no data' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="allZero" class="text-xs text-gray-600 mt-2">
          CloudWatch metrics take ~24h to appear for new functions.
        </p>
      </section>

      <!-- S3 data files -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Data Files</h2>
        <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th class="px-4 py-2.5">File</th>
                <th class="px-4 py-2.5 text-right">Size</th>
                <th class="px-4 py-2.5">Last modified</th>
                <th class="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/50">
              <tr v-for="f in s3Files" :key="f.file" class="hover:bg-gray-800/30 transition-colors">
                <td class="px-4 py-2.5 font-mono text-xs text-gray-300">{{ f.file }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-400">
                  {{ f.size_kb ? `${f.size_kb} KB` : '—' }}
                </td>
                <td class="px-4 py-2.5 text-xs text-gray-500">{{ f.last_modified ?? '—' }}</td>
                <td class="px-4 py-2.5">
                  <span :class="f.size_kb > 0 ? 'text-green-400' : 'text-red-400'" class="text-xs">
                    {{ f.size_kb > 0 ? '● ready' : '● missing' }}
                  </span>
                </td>
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
import HelpPanel from '../components/HelpPanel.vue'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const HELP_FIELDS = [
  { name: 'Invocations (7d)', description: 'Total Lambda function invocations in the last 7 days across all pipeline functions. Each daily run = 7 invocations per function.' },
  { name: 'Errors (7d)', description: 'Total failed invocations in the last 7 days. A healthy pipeline should show 0.' },
  { name: 'DynamoDB Items', description: 'Total items stored in the DynamoDB table. Includes MODEL, PRICING, TOOL, GPU_OFFER and CHANGE entities.' },
  { name: 'Avg Duration', description: 'Average Lambda execution time in milliseconds over the last 7 days. Billed in 1ms increments.' },
  { name: 'Error Rate', description: 'Errors / Invocations ratio. Shown as percentage. 0% = all runs successful.' },
  { name: 'Status', description: '● ok = ran successfully. ● error = had failures. ○ no data = CloudWatch metrics not yet available (takes ~24h for new functions).' },
  { name: 'Data Files', description: 'S3 files served via CloudFront. Shows file size and last modification time. ● ready = file exists and has content. ● missing = file not found in S3.' },
]

const data = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await fetch(`${CLOUDFRONT_URL}/data/metrics.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    error.value = `Failed to load metrics: ${e.message}`
  } finally {
    loading.value = false
  }
})

const meta = computed(() => data.value?._meta)
const pipeline = computed(() => data.value?.pipeline ?? {})
const dynamodb = computed(() => data.value?.dynamodb ?? { item_count: 0 })
const functions = computed(() => data.value?.functions ?? [])
const s3Files = computed(() => data.value?.s3_files ?? [])
const allZero = computed(() => functions.value.every(f => f.invocations_7d === 0))
</script>
