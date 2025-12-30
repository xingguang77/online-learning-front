<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="当前班级">
          <el-select v-model="currentClassId" placeholder="请选择班级" @change="fetchQuestions" style="width: 200px">
            <el-option 
              v-for="c in classes" 
              :key="c.id" 
              :label="c.className" 
              :value="c.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="问题状态">
          <el-radio-group v-model="statusFilter" @change="fetchQuestions">
            <el-radio-button :label="null">全部</el-radio-button>
            <el-radio-button :label="0">待回答</el-radio-button>
            <el-radio-button :label="1">已回答</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="questions" style="width: 100%; margin-top: 20px;" v-loading="loading" border>
      <el-table-column prop="title" label="问题标题" min-width="150" />
      <el-table-column prop="content" label="问题详情" min-width="200" show-overflow-tooltip />
      
      <el-table-column label="问题附件" width="160">
        <template #default="scope">
          <div v-if="scope.row.fileUrls && scope.row.fileUrls.length > 0" class="file-list-preview">
            <div v-for="(url, index) in scope.row.fileUrls" :key="index" class="file-item">
              <el-image 
                v-if="isImage(url)" 
                style="width: 40px; height: 40px; margin-right: 5px; border-radius: 4px;"
                :src="url" 
                :preview-src-list="[url]" 
                preview-teleported
                fit="cover"
              />
              <el-link v-else :href="url" target="_blank" type="primary" :underline="false">
                <el-icon><Document /></el-icon>附件{{index+1}}
              </el-link>
            </div>
          </div>
          <span v-else style="color: #909399;">无</span>
        </template>
      </el-table-column>

      <el-table-column prop="studentName" label="提问学生" width="120" />
      <el-table-column prop="createTime" label="提问时间" width="170" />
      
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '已解决' : '待处理' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="scope">
          <el-button 
            v-if="scope.row.status === 0" 
            type="primary" 
            size="small" 
            @click="openReplyDialog(scope.row)">
            去回答
          </el-button>
          
          <div v-else>
            <el-button type="info" link @click="openDetailDialog(scope.row)">查看</el-button>
            <el-button type="warning" link @click="openEditDialog(scope.row)">修改</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="question-review">
        <p><strong>问题：</strong>{{ currentQuestionTitle }}</p>
        <p v-if="currentQuestionContent" style="font-size: 13px; color: #666; margin-top: 5px;">
           详情：{{ currentQuestionContent }}
        </p>
      </div>

      <div v-if="isViewMode" class="answer-view">
        <p><strong>我的回答：</strong></p>
        <div class="answer-text">{{ replyForm.content }}</div>
        
        <div v-if="replyForm.fileUrls && replyForm.fileUrls.length" style="margin-top: 15px;">
           <p><strong>回答附件：</strong></p>
           <div class="file-list-preview">
             <div v-for="(url, index) in replyForm.fileUrls" :key="index" class="file-item-lg">
                <el-image 
                  v-if="isImage(url)" 
                  :src="url" 
                  :preview-src-list="[url]" 
                  fit="contain"
                  style="max-width: 100px; max-height: 100px; border: 1px solid #eee;"
                />
                <el-link v-else :href="url" target="_blank" type="primary">
                  <el-icon><Download /></el-icon> 点击下载附件 {{ index + 1 }}
                </el-link>
             </div>
           </div>
        </div>
      </div>

      <el-form v-else :model="replyForm" label-width="80px">
        <el-form-item label="回答内容">
          <el-input 
            type="textarea" 
            v-model="replyForm.content" 
            :rows="5" 
            placeholder="请输入您的解答..."
          ></el-input>
        </el-form-item>
        
        <el-form-item label="附件上传">
          <el-upload
            action="/api/upload"
            :headers="headers"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :on-preview="handlePreview" 
            list-type="picture-card">
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="font-size: 12px; color: #999; line-height: 1.5; margin-top: 5px;">
            支持图片预览；非图片文件点击列表可下载。
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="!isViewMode" type="primary" @click="submitReply" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import teacherApi from '@/api/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Download } from '@element-plus/icons-vue'

const route = useRoute()
const headers = { token: localStorage.getItem('token') || '' }

const classes = ref([]) 
const questions = ref([])
const currentClassId = ref(null)
const statusFilter = ref(0)
const loading = ref(false)
const submitting = ref(false)

// 弹窗状态
const dialogVisible = ref(false)
const isEdit = ref(false) // 是否修改
const isViewMode = ref(false) // 是否只读查看
const currentQuestionTitle = ref('')
const currentQuestionContent = ref('') // 增加详情回显
const fileList = ref([])

const replyForm = reactive({
  questionId: null,
  answerId: null,
  content: '',
  fileUrls: []
})

// 计算弹窗标题
const dialogTitle = computed(() => {
  if (isViewMode.value) return '回答详情'
  return isEdit.value ? '修改回答' : '回答问题'
})

onMounted(async () => {
  const res = await teacherApi.getMyClasses()
  if (res.code === 1) {
    classes.value = res.data.map(item => item.classInfo)
    if (route.query.classId) currentClassId.value = Number(route.query.classId)
    else if (classes.value.length > 0) currentClassId.value = classes.value[0].id
    
    if (route.query.status !== undefined) statusFilter.value = Number(route.query.status)
    fetchQuestions()
  }
})

const fetchQuestions = async () => {
  if (!currentClassId.value) return
  loading.value = true
  try {
    const res = await teacherApi.getClassQuestions(currentClassId.value, statusFilter.value)
    if(res.code === 1) {
      questions.value = res.data
    }
  } finally {
    loading.value = false
  }
}

// === 工具方法：判断是否图片 ===
const isImage = (url) => {
  if (!url) return false
  return /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(url)
}

// === 处理上传组件预览点击 ===
const handlePreview = (uploadFile) => {
  // 获取真实URL (上传成功后的 response.data 或者 回显时的 url)
  const url = uploadFile.url || (uploadFile.response && uploadFile.response.data)
  if (!url) return
  
  // 如果是图片，Element Plus 的 list-type="picture-card" 已经自带预览
  // 但如果是 PDF/Word 等，我们需要手动打开
  if (!isImage(url)) {
    window.open(url, '_blank')
  }
}

// 1. 去回答
const openReplyDialog = (row) => {
  isEdit.value = false
  isViewMode.value = false
  currentQuestionTitle.value = row.title
  currentQuestionContent.value = row.content
  
  replyForm.questionId = row.id
  replyForm.answerId = null
  replyForm.content = ''
  replyForm.fileUrls = []
  fileList.value = []
  dialogVisible.value = true
}

// 2. 修改回答 (需加载数据)
const openEditDialog = async (row) => {
  isEdit.value = true
  isViewMode.value = false
  await loadAnswerData(row)
  dialogVisible.value = true
}

// 3. 查看详情 (需加载数据)
const openDetailDialog = async (row) => {
  isEdit.value = false
  isViewMode.value = true
  await loadAnswerData(row)
  dialogVisible.value = true
}

// 复用：加载回答数据
const loadAnswerData = async (row) => {
  currentQuestionTitle.value = row.title
  currentQuestionContent.value = row.content
  
  const res = await teacherApi.getAnswer(row.id)
  if (res.code === 1 && res.data) {
    const answer = res.data
    replyForm.questionId = row.id
    replyForm.answerId = answer.id
    replyForm.content = answer.content || ''
    replyForm.fileUrls = answer.fileUrls || []
    
    // 初始化上传列表（用于编辑回显）
    fileList.value = replyForm.fileUrls.map((url, index) => ({
      name: `附件${index+1}`,
      url: url
    }))
  } else {
    ElMessage.error('获取回答详情失败')
  }
}

// 上传成功
const handleUploadSuccess = (response) => {
  if (response.code === 1) replyForm.fileUrls.push(response.data)
  else ElMessage.error('上传失败')
}

const handleRemove = (uploadFile) => {
  const urlToRemove = uploadFile.response ? uploadFile.response.data : uploadFile.url
  replyForm.fileUrls = replyForm.fileUrls.filter(url => url !== urlToRemove)
}

const submitReply = async () => {
  if(!replyForm.content) {
    ElMessage.warning('请输入回答内容')
    return
  }
  submitting.value = true
  try {
    const payload = {
      questionId: replyForm.questionId, // 只有新增需要，修改不需要但传了也无妨
      id: isEdit.value ? replyForm.answerId : undefined, // 修改需要 ID
      content: replyForm.content,
      fileUrls: replyForm.fileUrls
    }

    if (isEdit.value) {
      await teacherApi.updateAnswer(payload)
      ElMessage.success('修改成功')
    } else {
      await teacherApi.replyQuestion(payload)
      ElMessage.success('回答成功')
    }
    dialogVisible.value = false
    fetchQuestions()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该回答吗？', '提示', { type: 'warning' })
    .then(async () => {
       // 注意：由于我们之前改了 QuestionDTO 不带 answerId，
       // 这里如果 row.answerId 为空，删除会失败。
       // 严谨的做法是：先 getAnswer 拿到 ID 再删除，或者让后端 QuestionDTO 带上 answerId
       // 这里假设您已经修复了 handleAnswerId 的问题，或者先调用查询
       let aid = row.answerId
       if (!aid) {
         // 兜底：先查一下 ID
         const res = await teacherApi.getAnswer(row.id)
         if(res.code === 1 && res.data) aid = res.data.id
       }
       
       if(aid) {
         await teacherApi.deleteAnswer(aid)
         ElMessage.success('已删除')
         fetchQuestions()
       } else {
         ElMessage.error('无法获取回答ID')
       }
    })
}
</script>

<style scoped>
.question-review {
  margin-bottom: 15px; 
  padding: 10px; 
  background-color: #f5f7fa; 
  border-radius: 4px;
}
.answer-view {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.answer-text {
  white-space: pre-wrap;
  color: #333;
  margin-top: 5px;
}
.file-list-preview {
  display: flex; 
  flex-wrap: wrap; 
  gap: 10px;
}
.file-item {
  display: flex; 
  align-items: center;
}
.file-item-lg {
  margin-right: 15px;
  margin-bottom: 10px;
}
</style>