<template>
  <!-- Trigger button -->
  <button
    @click="open = !open"
    class="text-xs text-gray-600 hover:text-gray-300 transition-colors px-2 py-1 rounded border border-gray-800 hover:border-gray-600"
    title="Column definitions"
  >
    ? help
  </button>

  <!-- Overlay -->
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="open = false" />

      <!-- Panel -->
      <div class="relative w-80 bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl">
        <div class="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <span class="font-semibold text-white text-sm">{{ title }}</span>
          <button @click="open = false" class="text-gray-600 hover:text-white text-xl leading-none">×</button>
        </div>

        <div class="px-5 py-4 space-y-5">
          <div v-for="field in fields" :key="field.name">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold text-gray-200 uppercase tracking-wide">{{ field.name }}</span>
              <span v-if="field.badge" class="px-1.5 py-0 rounded text-xs" :class="field.badgeClass ?? 'bg-gray-800 text-gray-400'">
                {{ field.badge }}
              </span>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">{{ field.description }}</p>
            <div v-if="field.values" class="mt-2 space-y-1">
              <div v-for="v in field.values" :key="v.label" class="flex items-start gap-2">
                <span class="px-1.5 py-0 rounded text-xs shrink-0" :class="v.class ?? 'bg-gray-800 text-gray-400'">{{ v.label }}</span>
                <span class="text-xs text-gray-600">{{ v.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, required: true },
  fields: { type: Array, required: true },
})

const open = ref(false)
</script>
