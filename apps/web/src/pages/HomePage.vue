<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useApi } from "@/composables/useApi";

const api = useApi();

// --- State ---
const searchQuery = ref("");
const debouncedQuery = ref("");
const selectedSource = ref<string>("");
const selectedTagId = ref<string>("");

interface Article {
  id: string;
  url: string;
  title: string;
  description: string | null;
  source: "twitter" | "qiita" | "zenn" | "hatena" | "other";
  ogImageUrl: string | null;
  memo: string | null;
  isRead: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  articleCount: number;
  createdAt: string;
}

const articles = ref<Article[]>([]);
const nextCursor = ref<string | null>(null);
const tags = ref<Tag[]>([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);

// --- Source filters ---
const sourceFilters = [
  { value: "", label: "全て" },
  { value: "twitter", label: "Twitter" },
  { value: "qiita", label: "Qiita" },
  { value: "zenn", label: "Zenn" },
  { value: "hatena", label: "はてな" },
  { value: "other", label: "その他" },
] as const;

const sourceBadgeStyles: Record<string, string> = {
  twitter: "bg-blue-100 text-blue-800",
  qiita: "bg-green-100 text-green-800",
  zenn: "bg-sky-100 text-sky-800",
  hatena: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
};

const sourceLabels: Record<string, string> = {
  twitter: "Twitter",
  qiita: "Qiita",
  zenn: "Zenn",
  hatena: "はてな",
  other: "その他",
};

// --- Debounce ---
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val;
  }, 300);
});

// --- Fetch articles ---
async function fetchArticles(cursor?: string) {
  const query: Record<string, string> = {};
  if (debouncedQuery.value) query.q = debouncedQuery.value;
  if (selectedSource.value) query.source = selectedSource.value;
  if (selectedTagId.value) query.tagId = selectedTagId.value;
  if (cursor) query.cursor = cursor;

  const res = await api.api.articles.$get({ query });
  const data = await res.json();
  return data;
}

async function loadArticles() {
  isLoading.value = true;
  try {
    const data = await fetchArticles();
    articles.value = data.articles;
    nextCursor.value = data.nextCursor;
  } finally {
    isLoading.value = false;
  }
}

async function loadMore() {
  if (!nextCursor.value || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const data = await fetchArticles(nextCursor.value);
    articles.value = [...articles.value, ...data.articles];
    nextCursor.value = data.nextCursor;
  } finally {
    isLoadingMore.value = false;
  }
}

// --- Fetch tags ---
async function fetchTags() {
  const res = await api.api.tags.$get();
  const data = await res.json();
  tags.value = data.tags;
}

// --- Reload on filter change ---
watch([debouncedQuery, selectedSource, selectedTagId], () => {
  loadArticles();
});

// --- Helpers ---
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

const isEmpty = computed(() => !isLoading.value && articles.value.length === 0);

// --- Init ---
onMounted(() => {
  loadArticles();
  fetchTags();
});
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900">記事一覧</h2>

    <!-- 検索バー -->
    <div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="記事を検索..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- フィルタ -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- ソースフィルタ -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in sourceFilters"
          :key="f.value"
          class="px-3 py-1.5 text-sm rounded-full border transition-colors"
          :class="
            selectedSource === f.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          "
          @click="selectedSource = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- タグフィルタ -->
      <select
        v-model="selectedTagId"
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">全てのタグ</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.id">
          {{ tag.name }} ({{ tag.articleCount }})
        </option>
      </select>
    </div>

    <!-- ローディング（初回） -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="text-gray-500 text-sm">読み込み中...</div>
    </div>

    <!-- 空状態 -->
    <div v-else-if="isEmpty" class="text-center py-12">
      <p class="text-gray-500 text-sm">記事が見つかりませんでした。</p>
    </div>

    <!-- 記事カード一覧 -->
    <div v-else class="space-y-4">
      <div
        v-for="article in articles"
        :key="article.id"
        class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <!-- タイトル -->
            <RouterLink
              :to="`/articles/${article.id}`"
              class="text-base font-semibold text-gray-900 no-underline hover:text-blue-600 line-clamp-2"
            >
              {{ article.title }}
            </RouterLink>

            <!-- URL -->
            <a
              :href="article.url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 text-xs text-gray-500 no-underline hover:text-blue-500 block truncate"
            >
              {{ extractDomain(article.url) }}
            </a>
          </div>

          <!-- 既読/未読アイコン -->
          <span class="flex-shrink-0 mt-1" :title="article.isRead ? '既読' : '未読'">
            <span v-if="article.isRead" class="inline-block w-3 h-3 rounded-full bg-gray-300" />
            <span v-else class="inline-block w-3 h-3 rounded-full bg-blue-500" />
          </span>
        </div>

        <!-- メタ情報 -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <!-- ソースバッジ -->
          <span
            class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
            :class="sourceBadgeStyles[article.source]"
          >
            {{ sourceLabels[article.source] }}
          </span>

          <!-- タグ -->
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
          >
            {{ tag }}
          </span>

          <!-- 作成日時 -->
          <span class="text-xs text-gray-400 ml-auto">
            {{ formatDate(article.createdAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- もっと読み込む -->
    <div v-if="nextCursor && !isLoading" class="flex justify-center pt-2 pb-4">
      <button
        class="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ? "読み込み中..." : "もっと読み込む" }}
      </button>
    </div>
  </div>
</template>
