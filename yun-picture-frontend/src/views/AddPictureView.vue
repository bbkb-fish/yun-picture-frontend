<template>
  <div id="addPicturePage">
    <div class="page-header">
      <h2>创建图片</h2>
      <p class="page-desc">上传你的精彩图片</p>
    </div>
    <PictureUpload />
  </div>
</template>

<script setup lang="ts">
import PictureUpload from '@/components/PictureUpload.vue';
</script>

<style scoped>
#addPicturePage {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #303133;
}

.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
</style>
