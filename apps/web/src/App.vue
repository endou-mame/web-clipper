<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <RouterLink to="/" class="text-xl font-bold text-gray-900 no-underline">
          Web Clipper
        </RouterLink>
        <RouterLink
          to="/articles/add"
          class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium no-underline hover:bg-blue-700"
        >
          記事を追加
        </RouterLink>
      </div>
    </header>
    <main class="max-w-4xl mx-auto px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
