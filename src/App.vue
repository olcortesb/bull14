<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <nav class="border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <router-link to="/" class="font-bold text-white tracking-tight">bull14</router-link>
      <router-link to="/models" class="text-sm text-gray-400 hover:text-white transition-colors">Models</router-link>
      <router-link to="/pricing" class="text-sm text-gray-400 hover:text-white transition-colors">Pricing</router-link>
      <router-link to="/tools" class="text-sm text-gray-400 hover:text-white transition-colors">Tools</router-link>
      <router-link to="/hardware" class="text-sm text-gray-400 hover:text-white transition-colors">Hardware</router-link>
      <router-link to="/changelog" class="text-sm text-gray-400 hover:text-white transition-colors">Changelog</router-link>
    </nav>
    <router-view />
  </div>
</template>
