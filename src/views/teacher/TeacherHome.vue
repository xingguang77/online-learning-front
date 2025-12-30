<template>
  <div class="app-container">
    <div class="header-actions">
      <h2>我的教学班级</h2>
      <el-button type="primary" @click="router.push({ name: 'TeacherPublish' })">
        发布新资源
      </el-button>
    </div>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8" v-for="item in classList" :key="item.classInfo.id">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <div class="card-header">
              <span class="class-name">{{ item.classInfo.className }}</span>
              <el-tag effect="dark">{{ item.classInfo.courseName }}</el-tag>
            </div>
          </template>
          <div class="card-content">
            <p>课程ID：{{ item.classInfo.courseId }}</p>
            <p>学生人数：{{ item.classInfo.studentCount || '统计中' }}</p>
            
            <el-divider />
            
            <div class="action-area">
              <el-badge :value="item.unansweredCount" :max="99" :hidden="!item.unansweredCount">
                <el-button type="primary" plain @click="handleGoToQA(item.classInfo.id, 0)">
                  处理待办答疑
                </el-button>
              </el-badge>
              
              <el-button text @click="handleGoToQA(item.classInfo.id, null)">
                查看全部记录 >
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import teacherApi from '@/api/teacher'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus' // 改用 MessageBox

const classList = ref([])
const router = useRouter()

const fetchClasses = async () => {
  try {
    const res = await teacherApi.getMyClasses()
    if(res.code === 1) { 
      classList.value = res.data
      checkAndNotify(classList.value)
    }
  } catch (error) {
    console.error("获取班级失败", error)
  }
}

// 核心修改：使用 ElMessageBox 实现居中大弹窗
const checkAndNotify = (list) => {
  const totalUnanswered = list.reduce((sum, item) => sum + item.unansweredCount, 0)

  if (totalUnanswered > 0) {
    const targetClass = list.find(c => c.unansweredCount > 0)

    ElMessageBox.confirm(
      // 使用 h 函数自定义内容，调整字体大小和间距
      h('div', { style: 'padding: 10px 0; text-align: center;' }, [
        h('div', { style: 'font-size: 18px; color: #303133; margin-bottom: 10px; font-weight: bold;' }, 
          `当前共有 ${totalUnanswered} 条学生提问待解答`
        ),
        h('div', { style: 'font-size: 14px; color: #909399;' }, 
          '及时回复可以帮助学生更好地掌握知识，建议您现在处理。'
        )
      ]),
      '待办事项提醒', // 标题
      {
        confirmButtonText: '立即前往处理',
        cancelButtonText: '稍后再说',
        type: 'warning',
        center: true,        // 内容居中
        roundButton: true,   // 圆角按钮更美观
        width: '500px',      // (部分版本生效) 配合 customClass 确保宽度
        draggable: true,     // 允许拖拽
        closeOnClickModal: false, // 强制用户选择
        customClass: 'large-confirm-box' // 自定义类名，用于 CSS 强制样式
      }
    ).then(() => {
      // 用户点击“立即前往处理”
      if (targetClass) {
        handleGoToQA(targetClass.classInfo.id, 0)
      }
    }).catch(() => {
      // 用户点击“稍后再说”或关闭，不做操作
    })
  }
}

const handleGoToQA = (classId, status) => {
  router.push({ 
    name: 'TeacherQA', 
    query: { classId, status } 
  })
}

onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.action-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}
.box-card {
  margin-bottom: 20px;
}
.class-name {
  font-size: 16px;
  color: #303133;
}
</style>

<style>
.large-confirm-box {
  width: 520px !important; /* 强制加宽 */
  padding-bottom: 30px !important;
}
/* 让弹窗里的标题更大一点 */
.large-confirm-box .el-message-box__title {
  font-size: 20px;
}
/* 让按钮也稍微大一点 */
.large-confirm-box .el-button {
  padding: 12px 25px;
}
</style>