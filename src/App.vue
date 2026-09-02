<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
    <nav class="border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <router-link to="/" class="font-bold text-white tracking-tight">bull14</router-link>
      <router-link to="/models" class="text-sm text-gray-400 hover:text-white transition-colors">Models</router-link>
      <router-link to="/pricing" class="text-sm text-gray-400 hover:text-white transition-colors">Pricing</router-link>
      <router-link to="/tools" class="text-sm text-gray-400 hover:text-white transition-colors">Tools</router-link>
      <router-link to="/hardware" class="text-sm text-gray-400 hover:text-white transition-colors">Hardware</router-link>
      <router-link to="/changelog" class="text-sm text-gray-400 hover:text-white transition-colors">Changelog</router-link>
      <router-link to="/analytics" class="text-sm text-gray-400 hover:text-white transition-colors">Analytics</router-link>
      <router-link to="/metrics" class="text-sm text-gray-400 hover:text-white transition-colors">Metrics</router-link>
      <div class="ml-auto">
        <GlobalSearch />
      </div>
    </nav>
    <main class="flex-1">
      <router-view />
    </main>
    <footer class="border-t border-gray-800 mt-8">
      <div class="px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>Built by <a href="https://linkedin.com/in/olcortesb" target="_blank" class="hover:text-white transition-colors">olcortesb</a></span>
        <span>🔄 Updated daily</span>
        <a href="https://github.com/olcortesb/bull14" target="_blank" class="hover:text-white transition-colors">GitHub</a>
      </div>
      <div class="px-6 pb-3 text-center text-xs text-gray-600">
        This site does not collect personal data or use cookies.
      </div>
    </footer>
  </div>
</template>

<script setup>
import GlobalSearch from './components/GlobalSearch.vue'
</script>
