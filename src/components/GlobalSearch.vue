<template>
  <span>
    <!-- Trigger -->
    <button
      @click="open = true"
      class="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-300 border border-gray-800 hover:border-gray-600 rounded px-2.5 py-1 transition-colors"
    >
      <span>Search</span>
      <kbd class="text-gray-700 font-mono">⌘K</kbd>
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="close" />

        <!-- Panel -->
        <div class="relative w-full max-w-xl bg-gray-950 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <!-- Input -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <span class="text-gray-600 text-sm">⌕</span>
            <input
              ref="inputRef"
              v-model="query"
              placeholder="Search models, tools, providers..."
              class="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              @keydown.escape="close"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter.prevent="goToSelected"
            />
            <kbd @click="close" class="text-xs text-gray-700 border border-gray-800 rounded px-1.5 py-0.5 cursor-pointer hover:text-gray-400">esc</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-96 overflow-y-auto">
            <div v-if="query.length < 2" class="px-4 py-8 text-center text-xs text-gray-600">
              Type at least 2 characters to search
            </div>
            <div v-else-if="results.length === 0" class="px-4 py-8 text-center text-xs text-gray-600">
              No results for "{{ query }}"
            </div>
            <div v-else>
              <div
                v-for="(r, i) in results" :key="`${r.item.type}-${r.item.id}`"
                @click="navigate(r.item)"
                @mouseenter="selectedIndex = i"
                :class="selectedIndex === i ? 'bg-gray-800' : 'hover:bg-gray-900'"
                class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
              >
                <span :class="typeClass(r.item.type)" class="px-1.5 py-0.5 rounded text-xs font-medium w-16 text-center shrink-0">
                  {{ r.item.type }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-white truncate">{{ r.item.name }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ r.item.subtitle }}</div>
                </div>
                <span class="text-xs text-gray-700 shrink-0">{{ r.item.route }}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div v-if="results.length > 0" class="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-700">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Fuse from 'fuse.js'

const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const router = useRouter()
const open = ref(false)
const query = ref('')
const inputRef = ref(null)
const selectedIndex = ref(0)
const searchIndex = ref([])
let fuse = null

// Build flat search index from all data sources
async function buildIndex() {
  if (searchIndex.value.length > 0) return
  const items = []

  try {
    const [models, pricing, tools, hardware] = await Promise.allSettled([
      fetch(`${CLOUDFRONT_URL}/data/models.json`).then(r => r.json()),
      fetch(`${CLOUDFRONT_URL}/data/pricing.json`).then(r => r.json()),
      fetch(`${CLOUDFRONT_URL}/data/tools.json`).then(r => r.json()),
      fetch(`${CLOUDFRONT_URL}/data/hardware.json`).then(r => r.json()),
    ])

    if (models.status === 'fulfilled') {
      for (const m of models.value.models ?? []) {
        items.push({
          type: 'model', id: m.id, name: m.name,
          subtitle: `${m.provider} · ${m.access} · ${m.modalities?.join(', ')}`,
          route: '/models', keywords: [m.id, m.name, m.provider, m.license, ...(m.modalities ?? [])],
        })
      }
    }

    if (pricing.status === 'fulfilled') {
      for (const p of pricing.value.providers ?? []) {
        if (p.id.startsWith('~')) continue
        for (const m of p.models ?? []) {
          items.push({
            type: 'pricing', id: `${p.id}/${m.id}`, name: m.id,
            subtitle: `${p.id} · $${m.pricing?.standard?.input_per_1m ?? '?'}/1M in`,
            route: '/pricing', keywords: [m.id, p.id],
          })
        }
      }
    }

    if (tools.status === 'fulfilled') {
      for (const t of tools.value.tools ?? []) {
        items.push({
          type: 'tool', id: t.id, name: t.name,
          subtitle: `${t.category} · v${t.version ?? '?'} · ${t.activity ?? ''}`,
          route: '/tools', keywords: [t.id, t.name, t.category, t.description, t.license],
        })
      }
    }

    if (hardware.status === 'fulfilled') {
      for (const [pid, p] of Object.entries(hardware.value)) {
        for (const g of p.gpus ?? []) {
          items.push({
            type: 'gpu', id: `${pid}/${g.gpu_type}`, name: g.gpu_type,
            subtitle: `${p.name} · $${g.price_per_hour}/hr · ${g.vram_gb}GB VRAM`,
            route: '/hardware', keywords: [g.gpu_type, p.name, pid, p.category],
          })
        }
      }
    }

    searchIndex.value = items
    fuse = new Fuse(items, {
      keys: ['name', 'keywords', 'subtitle'],
      threshold: 0.3,
      minMatchCharLength: 2,
    })
  } catch (e) {
    console.error('Search index build failed:', e)
  }
}

const results = computed(() => {
  if (!fuse || query.value.length < 2) return []
  return fuse.search(query.value).slice(0, 12)
})

watch(results, () => { selectedIndex.value = 0 })

watch(open, async (val) => {
  if (val) {
    await buildIndex()
    await nextTick()
    inputRef.value?.focus()
  } else {
    query.value = ''
    selectedIndex.value = 0
  }
})

function close() {
  open.value = false
}

function navigate(item) {
  router.push(item.route)
  close()
}

function moveSelection(dir) {
  const max = results.value.length - 1
  selectedIndex.value = Math.max(0, Math.min(max, selectedIndex.value + dir))
}

function goToSelected() {
  const r = results.value[selectedIndex.value]
  if (r) navigate(r.item)
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function typeClass(type) {
  return {
    model:   'bg-blue-900/50 text-blue-300',
    pricing: 'bg-yellow-900/50 text-yellow-300',
    tool:    'bg-purple-900/50 text-purple-300',
    gpu:     'bg-orange-900/50 text-orange-300',
  }[type] ?? 'bg-gray-800 text-gray-400'
}
</script>
