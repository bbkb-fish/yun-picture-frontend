<template>
  <div class="picture-upload">
    <!-- 阶段1：上传区域 -->
    <div class="upload-area" v-if="!previewUrl && !uploading">
      <el-upload
        class="upload-box"
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        accept="image/*"
      >
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">将图片拖到此处，或点击上传</div>
        <template #tip>
          <div class="upload-tip">支持 JPG / PNG / GIF / WebP 格式</div>
        </template>
      </el-upload>
    </div>

    <!-- 阶段2：预览 + 确认上传 -->
    <div class="preview-area" v-if="previewUrl && !uploading && !uploadedPicture">
      <div class="preview-header">
        <span class="preview-title">图片预览</span>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          确认上传
        </el-button>
        <el-button @click="handleCancel">重新选择</el-button>
      </div>
      <div class="preview-box">
        <img :src="previewUrl" alt="预览" class="preview-image" />
      </div>
      <div class="preview-info">
        <span>文件名：{{ selectedFile?.name }}</span>
        <span>大小：{{ formatSize(selectedFile?.size ?? 0) }}</span>
      </div>
    </div>

    <!-- 阶段3：上传中 -->
    <div class="uploading-area" v-if="uploading">
      <el-icon class="loading-icon is-loading"><Loading /></el-icon>
      <p>正在上传...</p>
    </div>

    <!-- 阶段4：上传完成 → 填写图片信息 -->
    <div class="edit-area" v-if="uploadedPicture && !saving && !saveResult">
      <div class="preview-header">
        <span class="preview-title">上传成功，请完善图片信息</span>
      </div>
      <div class="preview-box">
        <img :src="uploadedPicture.url" alt="已上传图片" class="preview-image" />
      </div>

      <el-form :model="formData" label-position="top" class="upload-form">
        <el-form-item label="图片名称" required>
          <el-input v-model="formData.name" placeholder="请输入图片名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="图片简介">
          <el-input
            v-model="formData.introduction"
            type="textarea"
            placeholder="简单描述一下这张图片"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="formData.category" placeholder="选择热门分类，或输入自定义分类" clearable allow-create filterable style="width: 100%">
            <el-option
              v-for="cat in categoryOptions"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <div class="tag-input-container">
            <el-tag
              v-for="(tag, index) in formData.tags"
              :key="index"
              closable
              :disable-transitions="false"
              class="tag-item"
              @close="handleRemoveTag(index)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              class="tag-input"
              size="small"
              placeholder="输入标签名，回车添加"
              @keyup.enter="handleAddTag"
              @blur="handleAddTag"
            />
            <el-button v-else class="add-tag-btn" size="small" @click="showTagInput">
              + 添加标签
            </el-button>
          </div>
          <div class="tag-suggest" v-if="tagSuggestions.length">
            <span class="suggest-label">推荐标签：</span>
            <el-tag
              v-for="t in tagSuggestions"
              :key="t"
              size="small"
              class="suggest-tag"
              @click="handleAddSuggestTag(t)"
            >
              {{ t }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" @click="handleSave" :loading="saving" style="width: 100%">
            保存图片信息
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 阶段5：保存中 -->
    <div class="uploading-area" v-if="saving">
      <el-icon class="loading-icon is-loading"><Loading /></el-icon>
      <p>正在保存...</p>
    </div>

    <!-- 阶段6：全部完成 -->
    <div class="result-area" v-if="saveResult">
      <div class="result-header">
        <el-icon class="result-icon" color="#67c23a"><CircleCheckFilled /></el-icon>
        <span class="result-title">图片发布成功！</span>
        <el-button size="small" @click="handleReset">继续上传</el-button>
      </div>
      <div class="result-image-box">
        <img :src="saveResult.url" alt="上传结果" class="result-image" />
      </div>
      <div class="result-info">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="图片名称">{{ saveResult.name }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ saveResult.category || '无' }}</el-descriptions-item>
          <el-descriptions-item label="格式">{{ saveResult.picFormat }}</el-descriptions-item>
          <el-descriptions-item label="尺寸">{{ saveResult.picWidth }} × {{ saveResult.picHeight }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ formatSize(saveResult.picSize ?? 0) }}</el-descriptions-item>
          <el-descriptions-item label="缩放比例">{{ saveResult.picScale }}</el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <el-tag v-for="tag in saveResult.tags" :key="tag" size="small" style="margin-right: 4px">
              {{ tag }}
            </el-tag>
            <span v-if="!saveResult.tags?.length" style="color: #999">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="简介" :span="2">{{ saveResult.introduction || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading, CircleCheckFilled } from '@element-plus/icons-vue'
import { uploadPictureUsingPost, editPictureUsingPost, getPictureVoByIdUsingGet } from '@/services/api/pictureController'
import { listPictureTagCategoryUsingGet } from '@/services/api/pictureController'

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const uploading = ref(false)
const uploadedPicture = ref<API.PictureVO | null>(null)
const saving = ref(false)
const saveResult = ref<API.PictureVO | null>(null)

// 表单数据
const formData = reactive({
  name: '',
  introduction: '',
  category: '',
  tags: [] as string[],
})

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<any>(null)
const tagSuggestions = ref<string[]>([])
const categoryOptions = ref<string[]>([])

// 文件选择
function handleFileChange(file: any) {
  const rawFile = file.raw as File
  if (!rawFile) return

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  selectedFile.value = rawFile
  previewUrl.value = URL.createObjectURL(rawFile)
  uploadedPicture.value = null
  saveResult.value = null
}

// 第一步：上传图片到服务器
async function handleUpload() {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    const res = await uploadPictureUsingPost({
      file: selectedFile.value,
    } as any)
    if (res.data.code === 0 && res.data.data) {
      uploadedPicture.value = res.data.data
      ElMessage.success('图片上传成功，请完善信息')
    } else {
      ElMessage.error(res.data.message || '上传失败')
    }
  } catch {
    ElMessage.error('上传失败，请检查网络连接')
  } finally {
    uploading.value = false
  }
}

// 第二步：保存图片信息
async function handleSave() {
  if (!uploadedPicture.value?.id) return
  if (!formData.name.trim()) {
    ElMessage.warning('请输入图片名称')
    return
  }

  saving.value = true
  try {
    const res = await editPictureUsingPost({
      id: uploadedPicture.value.id,
      name: formData.name.trim(),
      introduction: formData.introduction.trim(),
      category: formData.category,
      tags: formData.tags,
    } as any)
    if (res.data.code === 0 && res.data.data) {
      // 编辑成功后再查一次获取完整 PictureVO
      const voRes = await getPictureVoByIdUsingGet({ id: uploadedPicture.value.id })
      if (voRes.data.code === 0 && voRes.data.data) {
        saveResult.value = voRes.data.data
      } else {
        saveResult.value = uploadedPicture.value
      }
      ElMessage.success('图片信息保存成功')
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败，请检查网络连接')
  } finally {
    saving.value = false
  }
}

// 标签管理
function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function handleAddTag() {
  const val = tagInputValue.value.trim()
  if (val && !formData.tags.includes(val)) {
    formData.tags.push(val)
  }
  tagInputValue.value = ''
  tagInputVisible.value = false
}

function handleAddSuggestTag(tag: string) {
  if (!formData.tags.includes(tag)) {
    formData.tags.push(tag)
  }
}

function handleRemoveTag(index: number) {
  formData.tags.splice(index, 1)
}

// 重新选择
function handleCancel() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = null
  previewUrl.value = ''
}

// 重置，继续上传
function handleReset() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = null
  previewUrl.value = ''
  uploadedPicture.value = null
  saveResult.value = null
  formData.name = ''
  formData.introduction = ''
  formData.category = ''
  formData.tags = []
}

// 加载分类和标签推荐
async function loadTagCategory() {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryOptions.value = res.data.data.categoryList ?? []
      tagSuggestions.value = res.data.data.tagList ?? []
    }
  } catch {
    // 静默失败
  }
}

// 文件大小格式化
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onMounted(() => {
  loadTagCategory()
})
</script>

<style scoped>
.picture-upload {
  max-width: 600px;
  margin: 0 auto;
}

.upload-box {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #409efc;
  margin-bottom: 8px;
}

.upload-text {
  color: #606266;
  font-size: 14px;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.preview-area,
.edit-area {
  text-align: center;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.preview-box {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  margin-bottom: 12px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  object-fit: contain;
}

.preview-info {
  display: flex;
  justify-content: center;
  gap: 24px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 20px;
}

/* ====== 表单 ====== */
.upload-form {
  text-align: left;
  margin-top: 8px;
}

/* ====== 标签输入 ====== */
.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 160px;
}

.add-tag-btn {
  border-style: dashed;
}

.tag-suggest {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.suggest-label {
  font-size: 12px;
  color: #909399;
}

.suggest-tag {
  cursor: pointer;
}

.suggest-tag:hover {
  opacity: 0.8;
}

.uploading-area {
  text-align: center;
  padding: 60px 0;
}

.loading-icon {
  font-size: 48px;
  color: #409efc;
}

.uploading-area p {
  margin-top: 12px;
  color: #606266;
}

.result-area {
  text-align: center;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.result-icon {
  font-size: 24px;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.result-image-box {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  margin-bottom: 16px;
}

.result-image {
  max-width: 100%;
  max-height: 360px;
  border-radius: 4px;
  object-fit: contain;
}

.result-info {
  text-align: left;
  margin-top: 16px;
}
</style>
