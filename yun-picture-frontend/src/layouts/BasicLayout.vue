<template>
  <div id="basicLayout">
    <el-row class="header">
      <el-col :span="24"> <GlobalHeader /> </el-col>
    </el-row>
    <el-row class="content">
      <el-col :span="24"> <router-view /> </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
</script>

<style scoped>
#basicLayout {
}
#basicLayout .header {
  padding-inline: 20px;
  background: white;
  color: unset;
  margin-bottom: 0;
}
#basicLayout .content {
  padding: 8px 20px;
  background: linear-gradient(to right, #fefefe, #fff);
}
.el-row {
  margin-bottom: 0;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
