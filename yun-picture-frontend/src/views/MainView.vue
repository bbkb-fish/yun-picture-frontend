<template>
  <div class="main-page">
    <!-- 搜索 & 筛选面板 -->
    <div class="filter-panel">
      <!-- 搜索行：单独一行，突出 -->
      <div class="search-row">
        <el-input
          v-model="searchForm.searchText"
          placeholder="搜索图片名称或简介..."
          clearable
          size="large"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button size="large" @click="handleReset">重置</el-button>
      </div>

      <!-- 分类行 -->
      <div class="filter-row" v-if="categories.length">
        <span class="filter-label">分类</span>
        <div class="filter-tags">
          <span
            class="filter-chip"
            :class="{ active: !selectedCategory && !searchForm.category }"
            @click="selectCategory('')"
          >全部</span>
          <span
            v-for="cat in categories"
            :key="cat"
            class="filter-chip"
            :class="{ active: selectedCategory === cat }"
            @click="selectCategory(cat)"
          >{{ cat }}</span>
        </div>
        <el-select
          v-model="searchForm.category"
          placeholder="下拉选择"
          clearable
          size="small"
          class="filter-inline-select"
          @change="onCategorySelectChange"
        >
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </div>

      <!-- 标签行 -->
      <div class="filter-row" v-if="tagList.length">
        <span class="filter-label">标签</span>
        <div class="filter-tags">
          <span
            class="filter-chip"
            :class="{ active: selectedTags.length === 0 && !searchForm.tags }"
            @click="clearTags()"
          >全部</span>
          <span
            v-for="tag in tagList"
            :key="tag"
            class="filter-chip"
            :class="{ active: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >{{ tag }}</span>
        </div>
        <el-input
          v-model="searchForm.tags"
          placeholder="自定义标签，逗号分隔"
          clearable
          size="small"
          class="filter-inline-input"
          @change="onTagsInputChange"
        />
      </div>
    </div>

    <!-- 图片网格 -->
    <div class="picture-grid" v-loading="loading">
      <div v-if="!loading && pictures.length === 0" class="empty-state">
        <el-empty description="暂无图片" />
      </div>
      <router-link
        v-for="pic in pictures"
        :key="pic.id"
        :to="`/picture/${pic.id}`"
        class="picture-card"
      >
        <div class="card-image-box">
          <img :src="pic.url" :alt="pic.name" class="card-image" />
        </div>
        <div class="card-body">
          <div class="card-title">{{ pic.name || '未命名' }}</div>
          <div class="card-tags">
            <el-tag
              v-for="tag in pic.tags?.slice(0, 3)"
              :key="tag"
              size="small"
              class="card-tag"
            >
              {{ tag }}
            </el-tag>
            <span v-if="!pic.tags?.length" class="no-tag">暂无标签</span>
          </div>
          <div class="card-footer">
            <span class="card-user">{{ pic.user?.userName ?? '未知用户' }}</span>
            <span class="card-category">
              <el-tag v-if="pic.category" size="small" type="info">{{ pic.category }}</el-tag>
            </span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="current"
        :page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { listPictureVoByPageUsingPost, listPictureTagCategoryUsingGet } from '@/services/api/pictureController'

const pictures = ref<API.PictureVO[]>([])
const loading = ref(false)
const current = ref(1)
const total = ref(0)

// 筛选
const categories = ref<string[]>([])
const tagList = ref<string[]>([])
const selectedCategory = ref('')
const selectedTags = ref<string[]>([])

// 搜索表单
const searchForm = reactive({
  searchText: '',
  category: '',
  tags: '',
})

// 响应式：根据屏幕宽度决定列数和每页条数
const windowWidth = ref(window.innerWidth)
function onResize() {
  windowWidth.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const pageSize = computed(() => {
  if (windowWidth.value >= 1200) return 12
  if (windowWidth.value >= 768) return 12
  return 8
})

const pageSizeOptions = computed(() => {
  if (windowWidth.value >= 1200) return [12, 16, 20, 24]
  if (windowWidth.value >= 768) return [9, 12, 15, 18]
  return [6, 8, 10, 12]
})

// 加载图片
async function loadPictures() {
  loading.value = true
  try {
    // 搜索栏关键词 + 筛选栏分类/标签（select/input 与芯片互补）
    const searchText = searchForm.searchText || undefined
    const category = searchForm.category || selectedCategory.value || undefined
    const chipTags = selectedTags.value.length ? selectedTags.value : undefined
    const inputTags = searchForm.tags
      ? searchForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined
    // 搜索栏标签和筛选芯片标签合并
    let tags: string[] | undefined
    if (chipTags && inputTags) {
      tags = [...new Set([...chipTags, ...inputTags])]
    } else {
      tags = chipTags || inputTags
    }

    const res = await listPictureVoByPageUsingPost({
      current: current.value,
      pageSize: pageSize.value,
      sortField: 'createTime',
      sortOrder: 'desc',
      searchText,
      category,
      tags,
    })
    if (res.data.code === 0 && res.data.data) {
      const page = res.data.data
      pictures.value = page.records ?? []
      total.value = page.total ?? 0
    }
  } catch {
    // 静默
  } finally {
    loading.value = false
  }
}

// 筛选
function selectCategory(cat: string) {
  searchForm.category = ''
  selectedCategory.value = cat
  selectedTags.value = []
  searchForm.tags = ''
  current.value = 1
  loadPictures()
}

function toggleTag(tag: string) {
  searchForm.tags = ''
  selectedCategory.value = ''
  searchForm.category = ''
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
  current.value = 1
  loadPictures()
}

function clearTags() {
  selectedTags.value = []
  searchForm.tags = ''
  current.value = 1
  loadPictures()
}

// 筛选栏右侧下拉/输入
function onCategorySelectChange() {
  selectedCategory.value = ''
  selectedTags.value = []
  searchForm.tags = ''
  current.value = 1
  loadPictures()
}

function onTagsInputChange() {
  selectedTags.value = []
  selectedCategory.value = ''
  searchForm.category = ''
  current.value = 1
  loadPictures()
}

// 搜索栏
function handleSearch() {
  selectedCategory.value = ''
  selectedTags.value = []
  current.value = 1
  loadPictures()
}

function handleReset() {
  searchForm.searchText = ''
  searchForm.category = ''
  searchForm.tags = ''
  selectedCategory.value = ''
  selectedTags.value = []
  current.value = 1
  loadPictures()
}

// 加载分类和标签
async function loadTagCategory() {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categories.value = res.data.data.categoryList ?? []
      tagList.value = res.data.data.tagList ?? []
    }
  } catch {
    // 静默
  }
}

function handleCurrentChange() {
  loadPictures()
}

function handleSizeChange() {
  current.value = 1
  loadPictures()
}

onMounted(() => {
  loadTagCategory()
  loadPictures()
})
</script>

<style scoped>
.main-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 20px 20px;
}

/* ====== 搜索 & 筛选面板 ====== */
.filter-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 搜索行 */
.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  flex: 1;
}

/* 筛选行 */
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.filter-row + .filter-row {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
}

.filter-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  line-height: 28px;
  min-width: 36px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  display: inline-block;
  padding: 4px 14px;
  font-size: 13px;
  border-radius: 20px;
  cursor: pointer;
  background: #f5f5f5;
  color: #606266;
  transition: all 0.2s;
  user-select: none;
}

.filter-chip:hover {
  background: #ecf5ff;
  color: #409efc;
}

.filter-chip.active {
  background: #409efc;
  color: #fff;
}

.filter-inline-select {
  width: 140px;
  flex-shrink: 0;
  margin-left: auto;
}

.filter-inline-input {
  width: 180px;
  flex-shrink: 0;
  margin-left: auto;
}

/* ====== 图片网格 ====== */
.picture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.picture-card {
  display: block;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid #ebeef5;
  text-decoration: none;
  color: inherit;
}

.picture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-image-box {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f5f5f5;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.picture-card:hover .card-image {
  transform: scale(1.05);
}

/* ====== 卡片内容 ====== */
.card-body {
  padding: 12px 14px 14px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  min-height: 24px;
}

.card-tag {
  margin: 0;
}

.no-tag {
  color: #c0c4cc;
  font-size: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-user {
  font-size: 12px;
  color: #909399;
}

/* ====== 分页 ====== */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 80px 0;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1199px) {
  .picture-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .main-page {
    padding: 12px;
  }

  .picture-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .card-body {
    padding: 10px;
  }

  .card-title {
    font-size: 13px;
  }
}
</style>
