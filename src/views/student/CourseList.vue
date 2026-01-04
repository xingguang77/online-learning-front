<template>
  <div class="app-container">
    <el-alert
      v-if="unreadCount > 0"
      :title="`您有 ${unreadCount} 条新回答，点击查看消息中心`"
      type="warning"
      effect="dark"
      show-icon
      class="notification-alert"
      @click="$router.push('/student/center?tab=qa')"
    />

    <h2 class="page-title">我的课程班级</h2>
    
    <div v-loading="loading">
      <el-empty v-if="classList.length === 0" description="暂无课程，请联系管理员排课" />
      
      <el-row :gutter="20">
        <el-col :span="6" v-for="item in classList" :key="item.id" style="margin-bottom: 20px;">
          <el-card shadow="hover" class="course-card" @click="handleEnterCourse(item)">
            <div class="course-cover">
              <span class="course-name">{{ item.courseName }}</span>
            </div>
            <div class="card-body">
              <div class="class-name">班级：{{ item.className }}</div>
              <div class="teacher-name" v-if="item.teacherName">教师：{{ item.teacherName }}</div> 
            </div>
            <div class="card-footer">
              <el-button type="primary" text>进入学习 >></el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import studentCourseApi from '@/api/studentCourse'

const router = useRouter()
const loading = ref(false)
const classList = ref([])
const unreadCount = ref(0)

onMounted(async () => {
  loading.value = true
  try {
    // 1. 获取课程列表
    const res = await studentCourseApi.getMyClasses()
    if(res.code === 1) {
      classList.value = res.data
    }
    // 2. 获取通知数
    const nRes = await studentCourseApi.getUnreadCount()
    if(nRes.code === 1) unreadCount.value = nRes.data
  } finally {
    loading.value = false
  }
})

const handleEnterCourse = (item) => {
  // 跳转到详情页，带上 classId 和 courseId
  // query传参方便刷新后数据还在
  router.push({
    path: `/student/course/${item.id}`,
    query: { courseId: item.courseId, name: item.courseName }
  })
}
</script>

<style scoped>
.notification-alert { margin-bottom: 20px; cursor: pointer; }
.page-title { margin-bottom: 20px; font-weight: 600; color: #303133; }
.course-card { cursor: pointer; transition: transform 0.2s; border: none; overflow: hidden; }
.course-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.course-cover {
  height: 120px;
  background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
}
.card-body { padding: 15px; }
.class-name { font-size: 16px; font-weight: 500; margin-bottom: 5px; }
.teacher-name { font-size: 13px; color: #909399; }
.card-footer { border-top: 1px solid #f0f0f0; padding: 10px; text-align: right; }
</style>