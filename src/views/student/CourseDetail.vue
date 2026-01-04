<template>
  <div class="app-container">
    <el-card shadow="never" class="course-header">
      <div class="header-content">
        <el-button @click="$router.push('/student')" circle icon="Back" style="margin-right: 15px" />
        <div>
          <h2 class="c-title">{{ courseName }}</h2>
          <span class="c-sub">当前班级ID: {{ classId }}</span>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px; min-height: 500px;">
      <el-tabs v-model="activeTab" class="custom-tabs">
        
        <el-tab-pane label="学习资源" name="resource">
          <span slot="label"><el-icon><Document /></el-icon> 学习资源</span>
          <ResourceTab v-if="activeTab === 'resource'" :course-id="Number(courseId)" :class-id="Number(classId)" />
        </el-tab-pane>

        <el-tab-pane label="讨论区" name="qa">
          <span slot="label"><el-icon><ChatLineRound /></el-icon> 讨论区</span>
          <QATab v-if="activeTab === 'qa'" :course-id="Number(courseId)" />
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
// 引入您之前写的组件 (稍微改造一下以支持 props)
import ResourceTab from './ResourceCenter.vue' 
import QATab from './QAList.vue'
import { Document, ChatLineRound, Back } from '@element-plus/icons-vue'

const route = useRoute()
const activeTab = ref('qa') // 默认进讨论区，或者根据需求改

// 从路由获取参数
const classId = route.params.id
const courseId = route.query.courseId
const courseName = route.query.name || '课程详情'

</script>

<style scoped>
.course-header { background: #fff; border-left: 5px solid #409EFF; }
.header-content { display: flex; align-items: center; }
.c-title { margin: 0; font-size: 22px; color: #303133; }
.c-sub { margin-left: 10px; color: #909399; font-size: 14px; }
.custom-tabs :deep(.el-tabs__item) { font-size: 16px; height: 50px; line-height: 50px; }
</style>