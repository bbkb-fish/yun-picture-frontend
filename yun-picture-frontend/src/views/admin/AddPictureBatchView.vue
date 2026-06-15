<template>
  <div class="batch-page">
    <div class="batch-card">
      <h2 class="batch-title">关键词批量创建图片</h2>
      <p class="batch-desc">输入关键词和数量，系统将自动抓取图片</p>

      <el-form :model="form" label-position="top" class="batch-form">
        <el-form-item label="搜索关键词" required>
          <el-input
            v-model="form.searchText"
            placeholder="例如：二次元、风景、猫咪..."
            size="large"
            clearable
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item label="图片数量" required>
          <el-input-number
            v-model="form.count"
            :min="1"
            :max="30"
            :step="1"
            size="large"
            controls-position="right"
            style="width: 100%"
          />
          <span class="count-tip">最多 30 张</span>
        </el-form-item>

        <el-form-item label="图片质量">
          <el-select v-model="form.initPic" size="large" style="width: 100%">
            <el-option label="缩略图" :value="0" />
            <el-option label="高清图" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="!form.searchText.trim() || form.count < 1"
            @click="handleSubmit"
            style="width: 100%"
          >
            <el-icon v-if="!submitting"><UploadFilled /></el-icon>
            {{ submitting ? '正在抓取...' : '开始批量创建' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 结果 -->
      <div v-if="result !== null" class="batch-result">
        <el-icon class="result-icon" :color="result > 0 ? '#67c23a' : '#f56c6c'">
          <CircleCheckFilled v-if="result > 0" />
          <CircleCloseFilled v-else />
        </el-icon>
        <span class="result-text">
          {{ result > 0 ? `成功创建 ${result} 张图片` : '创建失败' }}
        </span>
        <el-button v-if="result > 0" type="primary" link @click="$router.push('/admin/pictureManage')">
          前往管理 →
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { uploadBatchUsingPost } from '@/services/api/pictureController'

const submitting = ref(false)
const result = ref<number | null>(null)

const form = reactive({
  searchText: '',
  count: 10,
  initPic: 1 as number,
})

async function handleSubmit() {
  if (!form.searchText.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  if (form.count < 1 || form.count > 30) {
    ElMessage.warning('图片数量需在 1~30 之间')
    return
  }

  submitting.value = true
  result.value = null
  try {
    const params = {
      searchText: form.searchText.trim(),
      count: form.count,
      initPic: form.initPic,
    }
    console.log('[AddPictureBatch] 提交参数:', params)
    const res = await uploadBatchUsingPost(params)
    if (res.data.code === 0) {
      result.value = res.data.data ?? 0
      if (result.value && result.value > 0) {
        ElMessage.success(`成功创建 ${result.value} 张图片`)
      } else {
        ElMessage.warning('未获取到图片')
      }
    } else {
      ElMessage.error(res.data.message || '批量创建失败')
    }
  } catch {
    ElMessage.error('请求失败，请检查网络')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.batch-page {
  max-width: 520px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.batch-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.batch-title {
  margin: 0 0 8px;
  font-size: 22px;
  color: #303133;
  text-align: center;
}

.batch-desc {
  margin: 0 0 32px;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.batch-form {
  margin-top: 8px;
}

.count-tip {
  display: block;
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.batch-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
}

.result-icon {
  font-size: 22px;
}

.result-text {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
</style>
