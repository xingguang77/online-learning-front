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
      
      <el-table-column label="问题附件" width="180">
        <template #default="scope">
          <div v-if="scope.row.fileUrls && scope.row.fileUrls.length > 0">
            <div v-for="(url, index) in scope.row.fileUrls" :key="index" style="margin-bottom: 5px;">
              <template v-if="isImage(url)">
                <el-image 
                  :src="url" 
                  :preview-src-list="scope.row.fileUrls" 
                  :initial-index="index"
                  style="width: 40px; height: 40px; border-radius: 4px; border: 1px solid #eee; cursor: pointer;" 
                  preview-teleported
                  fit="cover"
                />
              </template>
              <template v-else>
                <el-button type="primary" link @click="downloadFile(url)" style="padding: 0; height: auto;">
                  <el-icon><Document /></el-icon> {{ getFileName(url) }}
                </el-button>
              </template>
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
           <div class="custom-file-list">
             <div v-for="(url, index) in replyForm.fileUrls" :key="index" class="custom-file-item">
                <div v-if="isImage(url)" class="img-wrapper no-border">
                  <el-image 
                    :src="url" 
                    :preview-src-list="replyForm.fileUrls"
                    :initial-index="index"
                    fit="cover"
                    class="upload-thumb"
                  />
                </div>
                <div v-else class="file-wrapper">
                  <div class="file-info">
                    <el-icon><Document /></el-icon>
                    <span class="fname" :title="getFileName(url)">{{ getFileName(url) }}</span>
                  </div>
                  <div class="file-actions">
                    <el-button link type="primary" @click="downloadFile(url)">
                      <el-icon><Download /></el-icon>
                    </el-button>
                  </div>
                </div>
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
            :show-file-list="false"
            :on-success="handleUploadSuccess"
          >
            <el-button size="small" type="primary" icon="Plus">点击上传</el-button>
          </el-upload>

          <div class="custom-file-list" v-if="replyForm.fileUrls && replyForm.fileUrls.length > 0">
            <div v-for="(url, index) in replyForm.fileUrls" :key="index" class="custom-file-item">
              
              <div v-if="isImage(url)" class="img-wrapper">
                <el-image 
                  :src="url" 
                  :preview-src-list="replyForm.fileUrls"
                  :initial-index="index"
                  fit="cover"
                  class="upload-thumb"
                />
                <div class="img-remove" @click="removeFile(index)">
                  <el-icon><CircleCloseFilled /></el-icon>
                </div>
              </div>

              <div v-else class="file-wrapper">
                <div class="file-info">
                  <el-icon><Document /></el-icon>
                  <span class="fname" :title="getFileName(url)">{{ getFileName(url) }}</span>
                </div>
                <div class="file-actions">
                  <el-button link type="primary" @click="downloadFile(url)">
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button link type="danger" @click="removeFile(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

            </div>
          </div>
          <div style="font-size: 12px; color: #999; line-height: 1.5; margin-top: 5px; width: 100%;">
            支持图片预览；非图片文件点击下载按钮。
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
// 引入完整图标
import { Plus, Document, Download, Delete, CircleCloseFilled } from '@element-plus/icons-vue'

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
const isEdit = ref(false)
const isViewMode = ref(false)
const currentQuestionTitle = ref('')
const currentQuestionContent = ref('') 

const replyForm = reactive({
  questionId: null,
  answerId: null,
  content: '',
  fileUrls: []
})

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

// === 工具方法 ===
const isImage = (url) => {
  if (!url) return false
  const ext = url.substring(url.lastIndexOf('.')).toLowerCase()
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  return imageExtensions.includes(ext)
}

const getFileName = (url) => {
  if (!url) return '未知文件'
  let fileName = url.substring(url.lastIndexOf('/') + 1)
  fileName = fileName.split('?')[0]
  try { return decodeURIComponent(fileName) } catch (e) { return fileName }
}

const downloadFile = (url) => {
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', getFileName(url))
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// === 操作逻辑 ===
const openReplyDialog = (row) => {
  isEdit.value = false
  isViewMode.value = false
  currentQuestionTitle.value = row.title
  currentQuestionContent.value = row.content
  
  replyForm.questionId = row.id
  replyForm.answerId = null
  replyForm.content = ''
  replyForm.fileUrls = []
  dialogVisible.value = true
}

const openEditDialog = async (row) => {
  isEdit.value = true
  isViewMode.value = false
  await loadAnswerData(row)
  dialogVisible.value = true
}

const openDetailDialog = async (row) => {
  isEdit.value = false
  isViewMode.value = true
  await loadAnswerData(row)
  dialogVisible.value = true
}

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
  } else {
    ElMessage.error('获取回答详情失败')
  }
}

// 上传成功
const handleUploadSuccess = (response) => {
  if (response.code === 1) replyForm.fileUrls.push(response.data)
  else ElMessage.error('上传失败')
}

// 移除文件
const removeFile = (index) => {
  replyForm.fileUrls.splice(index, 1)
}

const submitReply = async () => {
  if(!replyForm.content) {
    ElMessage.warning('请输入回答内容')
    return
  }
  submitting.value = true
  try {
    const payload = {
      questionId: replyForm.questionId, 
      id: isEdit.value ? replyForm.answerId : undefined,
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
       let aid = row.answerId
       if (!aid) {
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

/* 复用自定义样式 */
.custom-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.img-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
.img-wrapper.no-border {
  border: none;
  overflow: hidden;
}

.upload-thumb {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.img-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  color: #f56c6c;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.img-remove:hover {
  transform: scale(1.1);
}

.file-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  padding: 6px 10px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  overflow: hidden;
  margin-right: 10px;
}

.fname {
  font-size: 12px;
  margin-left: 6px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
</style>