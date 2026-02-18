<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "@/composables/useApi";

const router = useRouter();
const api = useApi();

// Form state
const url = ref("");
const tags = ref<string[]>([]);
const tagInput = ref("");
const memo = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

// Existing tags from API
const existingTags = ref<Array<{ id: string; name: string; articleCount: number }>>([]);
const showTagDropdown = ref(false);

// URL validation
const urlError = computed(() => {
  if (!url.value) return "";
  try {
    new URL(url.value);
    return "";
  } catch {
    return "有効なURLを入力してください";
  }
});

const isFormValid = computed(() => {
  return url.value.trim() !== "" && urlError.value === "";
});

// Filtered tags for dropdown (exclude already selected)
const filteredTags = computed(() => {
  const input = tagInput.value.toLowerCase();
  return existingTags.value
    .filter((t) => !tags.value.includes(t.name))
    .filter((t) => (input ? t.name.toLowerCase().includes(input) : true));
});

// Fetch existing tags
onMounted(async () => {
  try {
    const res = await api.api.tags.$get();
    const data = await res.json();
    existingTags.value = data.tags;
  } catch {
    // Silently fail - tags dropdown will just be empty
  }
});

function addTag(tagName: string) {
  const trimmed = tagName.trim();
  if (trimmed && !tags.value.includes(trimmed)) {
    tags.value.push(trimmed);
  }
  tagInput.value = "";
  showTagDropdown.value = false;
}

function removeTag(tagName: string) {
  tags.value = tags.value.filter((t) => t !== tagName);
}

function handleTagKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const value = tagInput.value.replace(/,/g, "").trim();
    if (value) {
      addTag(value);
    }
  }
}

function handleTagInputFocus() {
  showTagDropdown.value = true;
}

function handleTagInputBlur() {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showTagDropdown.value = false;
  }, 200);
}

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const res = await api.api.articles.$post({
      json: {
        url: url.value,
        tags: tags.value.length > 0 ? tags.value : [],
        memo: memo.value || undefined,
      },
    });

    if (!res.ok) {
      const errorData = (await res.json()) as { error: string; message: string };
      errorMessage.value = errorData.message;
      return;
    }

    router.push("/");
  } catch {
    errorMessage.value = "記事の追加に失敗しました。もう一度お試しください。";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <h2 class="mb-6 text-2xl font-bold text-gray-900">記事を追加</h2>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- URL input -->
      <div>
        <label for="url" class="mb-1 block text-sm font-medium text-gray-700">URL</label>
        <input
          id="url"
          v-model="url"
          type="url"
          placeholder="https://example.com/article"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-500': urlError }"
        />
        <p v-if="urlError" class="mt-1 text-sm text-red-600">{{ urlError }}</p>
      </div>

      <!-- Tags input -->
      <div>
        <label for="tag-input" class="mb-1 block text-sm font-medium text-gray-700">タグ</label>

        <!-- Selected tags -->
        <div v-if="tags.length > 0" class="mb-2 flex flex-wrap gap-2">
          <span
            v-for="tag in tags"
            :key="tag"
            class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
          >
            {{ tag }}
            <button
              type="button"
              class="ml-1 text-blue-600 hover:text-blue-900"
              @click="removeTag(tag)"
            >
              &times;
            </button>
          </span>
        </div>

        <!-- Tag input with dropdown -->
        <div class="relative">
          <input
            id="tag-input"
            v-model="tagInput"
            type="text"
            placeholder="タグを入力（Enterまたはカンマで追加）"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            @keydown="handleTagKeydown"
            @focus="handleTagInputFocus"
            @blur="handleTagInputBlur"
          />

          <!-- Dropdown -->
          <ul
            v-if="showTagDropdown && filteredTags.length > 0"
            class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            <li
              v-for="tag in filteredTags"
              :key="tag.id"
              class="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-blue-50"
              @mousedown.prevent="addTag(tag.name)"
            >
              {{ tag.name }}
              <span class="text-gray-400">({{ tag.articleCount }})</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Memo input -->
      <div>
        <label for="memo" class="mb-1 block text-sm font-medium text-gray-700">メモ</label>
        <textarea
          id="memo"
          v-model="memo"
          rows="4"
          placeholder="メモを入力"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Submit button -->
      <div>
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="isSubmitting" class="inline-flex items-center gap-2">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            送信中...
          </span>
          <span v-else>記事を追加</span>
        </button>
      </div>
    </form>
  </div>
</template>
