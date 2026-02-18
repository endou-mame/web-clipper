<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "@/composables/useApi";

const route = useRoute();
const router = useRouter();
const api = useApi();

const articleId = computed(() => route.params.id as string);

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

const article = ref<Article | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// メモ編集
const isEditingMemo = ref(false);
const editMemo = ref("");
const savingMemo = ref(false);

// タグ管理
const newTag = ref("");
const savingTags = ref(false);
const allTags = ref<string[]>([]);

// 既読切替
const togglingRead = ref(false);

// 削除
const deleting = ref(false);

const sourceColors: Record<Article["source"], string> = {
  twitter: "bg-sky-500 text-white",
  qiita: "bg-green-500 text-white",
  zenn: "bg-blue-600 text-white",
  hatena: "bg-red-500 text-white",
  other: "bg-gray-500 text-white",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ja-JP");
}

async function fetchArticle() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.api.articles[":id"].$get({ param: { id: articleId.value } });
    if (!res.ok) {
      if (res.status === 404) {
        error.value = "記事が見つかりませんでした。";
        return;
      }
      error.value = "記事の取得に失敗しました。";
      return;
    }
    article.value = (await res.json()) as Article;
  } catch {
    error.value = "記事の取得中にエラーが発生しました。";
  } finally {
    loading.value = false;
  }
}

async function fetchAllTags() {
  try {
    const res = await api.api.tags.$get();
    if (res.ok) {
      const data = await res.json();
      allTags.value = data.tags.map((t) => t.name);
    }
  } catch {
    // タグ取得失敗は無視
  }
}

async function toggleRead() {
  if (!article.value || togglingRead.value) return;
  togglingRead.value = true;
  try {
    const newIsRead = !article.value.isRead;
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { isRead: newIsRead },
    });
    if (res.ok) {
      article.value.isRead = newIsRead;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    togglingRead.value = false;
  }
}

function startEditMemo() {
  editMemo.value = article.value?.memo ?? "";
  isEditingMemo.value = true;
}

function cancelEditMemo() {
  isEditingMemo.value = false;
}

async function saveMemo() {
  if (!article.value || savingMemo.value) return;
  savingMemo.value = true;
  try {
    const memoValue = editMemo.value.trim() || null;
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { memo: memoValue },
    });
    if (res.ok) {
      article.value.memo = memoValue;
      isEditingMemo.value = false;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingMemo.value = false;
  }
}

async function removeTag(tag: string) {
  if (!article.value || savingTags.value) return;
  savingTags.value = true;
  try {
    const newTags = article.value.tags.filter((t) => t !== tag);
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { tags: newTags },
    });
    if (res.ok) {
      article.value.tags = newTags;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingTags.value = false;
  }
}

async function addTag() {
  if (!article.value || savingTags.value) return;
  const tag = newTag.value.trim();
  if (!tag || article.value.tags.includes(tag)) {
    newTag.value = "";
    return;
  }
  savingTags.value = true;
  try {
    const newTags = [...article.value.tags, tag];
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { tags: newTags },
    });
    if (res.ok) {
      article.value.tags = newTags;
      newTag.value = "";
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingTags.value = false;
  }
}

async function deleteArticle() {
  if (!article.value || deleting.value) return;
  if (!window.confirm("この記事を削除しますか？")) return;
  deleting.value = true;
  try {
    const res = await api.api.articles[":id"].$delete({ param: { id: articleId.value } });
    if (res.ok) {
      router.push("/");
    }
  } catch {
    // エラー時は何もしない
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  fetchArticle();
  fetchAllTags();
});
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <!-- ローディング -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-lg text-gray-500">読み込み中...</div>
    </div>

    <!-- エラー -->
    <div v-else-if="error" class="py-20 text-center">
      <div class="text-lg text-red-500">{{ error }}</div>
      <button
        class="mt-4 rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
        @click="router.push('/')"
      >
        一覧に戻る
      </button>
    </div>

    <!-- 記事詳細 -->
    <div v-else-if="article">
      <!-- 戻るリンク -->
      <button class="mb-4 text-sm text-gray-500 hover:text-gray-700" @click="router.push('/')">
        &larr; 一覧に戻る
      </button>

      <!-- メインカード -->
      <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
        <!-- OG画像 -->
        <img
          v-if="article.ogImageUrl"
          :src="article.ogImageUrl"
          :alt="article.title"
          class="h-auto w-full rounded-t-lg object-cover"
        />

        <div class="p-6">
          <!-- ソースバッジ + 既読状態 -->
          <div class="mb-3 flex items-center gap-2">
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="sourceColors[article.source]"
            >
              {{ article.source }}
            </span>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                article.isRead ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              "
            >
              {{ article.isRead ? "既読" : "未読" }}
            </span>
          </div>

          <!-- タイトル -->
          <h1 class="mb-2 text-2xl font-bold text-gray-900">{{ article.title }}</h1>

          <!-- 外部リンク -->
          <a
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 break-all hover:underline"
          >
            {{ article.url }}
            <span class="text-xs">&#x2197;</span>
          </a>

          <!-- 説明文 -->
          <p v-if="article.description" class="mt-4 text-sm leading-relaxed text-gray-600">
            {{ article.description }}
          </p>

          <!-- 日時 -->
          <div class="mt-4 flex gap-4 text-xs text-gray-400">
            <span>作成: {{ formatDate(article.createdAt) }}</span>
            <span>更新: {{ formatDate(article.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 既読/未読トグル -->
      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">閲覧状態</span>
          <button
            :disabled="togglingRead"
            class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            :class="
              article.isRead
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            "
            @click="toggleRead"
          >
            {{ togglingRead ? "更新中..." : article.isRead ? "未読にする" : "既読にする" }}
          </button>
        </div>
      </div>

      <!-- メモ -->
      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">メモ</span>
          <button
            v-if="!isEditingMemo"
            class="text-sm text-blue-600 hover:underline"
            @click="startEditMemo"
          >
            編集
          </button>
        </div>

        <!-- 表示モード -->
        <div v-if="!isEditingMemo">
          <p v-if="article.memo" class="whitespace-pre-wrap text-sm text-gray-600">
            {{ article.memo }}
          </p>
          <p v-else class="text-sm text-gray-400">メモはありません</p>
        </div>

        <!-- 編集モード -->
        <div v-else>
          <textarea
            v-model="editMemo"
            rows="4"
            class="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="メモを入力..."
          />
          <div class="mt-2 flex gap-2">
            <button
              :disabled="savingMemo"
              class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              @click="saveMemo"
            >
              {{ savingMemo ? "保存中..." : "保存" }}
            </button>
            <button
              :disabled="savingMemo"
              class="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
              @click="cancelEditMemo"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>

      <!-- タグ管理 -->
      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <span class="mb-2 block text-sm font-medium text-gray-700">タグ</span>

        <!-- 現在のタグ -->
        <div class="mb-3 flex flex-wrap gap-2">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
          >
            {{ tag }}
            <button
              :disabled="savingTags"
              class="ml-0.5 text-blue-400 hover:text-blue-600"
              @click="removeTag(tag)"
            >
              &times;
            </button>
          </span>
          <span v-if="article.tags.length === 0" class="text-sm text-gray-400">
            タグはありません
          </span>
        </div>

        <!-- タグ追加 -->
        <div class="flex gap-2">
          <input
            v-model="newTag"
            type="text"
            list="tag-suggestions"
            class="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="新しいタグを追加..."
            @keydown.enter="addTag"
          />
          <datalist id="tag-suggestions">
            <option v-for="t in allTags" :key="t" :value="t" />
          </datalist>
          <button
            :disabled="savingTags || !newTag.trim()"
            class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            @click="addTag"
          >
            追加
          </button>
        </div>
      </div>

      <!-- 削除 -->
      <div class="mt-6 rounded-lg border border-red-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-red-700">記事を削除</span>
            <p class="text-xs text-gray-500">この操作は取り消せません。</p>
          </div>
          <button
            :disabled="deleting"
            class="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            @click="deleteArticle"
          >
            {{ deleting ? "削除中..." : "削除" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
