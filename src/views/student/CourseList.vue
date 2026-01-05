<template>
  <div class="app-container">
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
// 注意：删除了 ElMessageBox 的引入

const router = useRouter()
const loading = ref(false)
const classList = ref([])

onMounted(async () => {
  loading.value = true
  try {
    // 1. 只保留获取课程列表的逻辑
    const res = await studentCourseApi.getMyClasses()
    if(res.code === 1) {
      classList.value = res.data
    }
    
    // 【已删除】原有的 notification 检查和 ElMessageBox.confirm 逻辑
    // 因为这部分功能已经移动到了 src/views/layout/index.vue 中全局处理
    
  } finally {
    loading.value = false
  }
})

const handleEnterCourse = (item) => {
  router.push({
    path: `/student/course/${item.id}`,
    query: { courseId: item.courseId, name: item.courseName }
  })
}
</script>

<style scoped>
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