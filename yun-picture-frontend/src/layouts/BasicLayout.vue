<template>
  <div id="basicLayout">
    <el-row class="header">
      <el-col :span="24"> <GlobalHeader /> </el-col>
    </el-row>
    <el-row class="content">
      <el-col :span="24"> <router-view /> </el-col>

    </el-row>
    <el-row class="footer">
      <el-col :span="24">
        <a href="https://github.com/bbkb-fish" target="_blank">This is my github</a>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
</script>

<style scoped>
#basicLayout {
  height: 100vh;
}
#basicLayout .header {
  padding-inline: 20px;
  background: white;
  color: unset;
  margin-bottom: 16px;
}
#basicLayout .content {
  padding: 20px;
  background: linear-gradient(to right, #fefefe, #fff);
  margin-bottom: 28px;
}
#basicLayout .footer {
  background: #efefef;
  padding: 16px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
}
.el-row {
  margin-bottom: 20px;
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
