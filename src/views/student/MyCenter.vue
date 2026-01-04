<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        
        <el-tab-pane label="我的学习资料" name="resource">
          <div class="filter-bar">
            <el-input v-model="resQuery.keyword" placeholder="搜索资源标题" style="width: 200px" clearable @keyup.enter="fetchResources" />
            <el-button type="primary" @click="fetchResources" style="margin-left: 10px;">查询</el-button>
          </div>

          <el-table :data="resList" v-loading="resLoading" style="width: 100%; margin-top: 15px;" border>
            <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
            <el-table-column prop="courseName" label="所属课程" width="150" align="center" />
            <el-table-column prop="downloadCount" label="下载量" width="100" align="center" />
            <el-table-column prop="createTime" label="上传时间" width="170" align="center" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                  {{ scope.row.status === 1 ? '正常' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openResEdit(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleResDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination 
              v-model:current-page="resQuery.page" 
              v-model:page-size="resQuery.pageSize" 
              :total="resTotal"
              layout="total, prev, pager, next"
              @current-change="fetchResources"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的提问" name="qa">
          <div class="filter-bar">
            <el-input v-model="qaQuery.keyword" placeholder="搜索提问内容" style="width: 200px" clearable @keyup.enter="fetchQuestions" />
            <el-select v-model="qaQuery.status" placeholder="状态" clearable style="width: 120px; margin-left: 10px;" @change="fetchQuestions">
              <el-option label="待解决" :value="0" />
              <el-option label="已解决" :value="1" />
            </el-select>
            <el-button type="primary" @click="fetchQuestions" style="margin-left: 10px;">查询</el-button>
          </div>

          <el-table :data="qaList" v-loading="qaLoading" style="width: 100%; margin-top: 15px;" border>
            <el-table-column prop="title" label="问题标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="courseName" label="课程" width="150" align="center" />
            <el-table-column prop="createTime" label="提问时间" width="170" align="center" />
            <el-table-column label="回答数" width="100" align="center">
              <template #default="scope">
                <el-tag effect="plain" type="info">{{ scope.row.answers ? scope.row.answers.length : 0 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '已解决' : '待解决' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="scope">
                <el-button link type="success" @click="openViewAnswers(scope.row)">查看回答</el-button>
                <el-button link type="primary" @click="openQaEdit(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleQaDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination 
              v-model:current-page="qaQuery.page" 
              v-model:page-size="qaQuery.pageSize" 
              :total="qaTotal"
              layout="total, prev, pager, next"
              @current-change="fetchQuestions"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="resDialogVisible" title="修改资源" width="500px">
      <el-form :model="resForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="resForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="resForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="可见性">
          <el-radio-group v-model="resForm.visibility">
            <el-radio :label="0">仅本班</el-radio>
            <el-radio :label="1">公开</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            :headers="headers"
            :show-file-list="false"
            :on-success="handleResUploadSuccess"
          >
            <el-button size="small" type="primary" icon="Plus">点击上传</el-button>
          </el-upload>

          <div class="custom-file-list" v-if="resForm.fileUrls && resForm.fileUrls.length > 0">
            <div v-for="(url, index) in resForm.fileUrls" :key="index" class="custom-file-item">
              
              <div v-if="isImage(url)" class="img-wrapper">
                <el-image 
                  :src="url" 
                  :preview-src-list="resForm.fileUrls"
                  :initial-index="index"
                  fit="cover"
                  class="upload-thumb"
                />
                <div class="img-remove" @click="removeResFile(index)">
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
                  <el-button link type="danger" @click="removeResFile(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResUpdate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="qaEditVisible" title="修改问题" width="500px">
      <el-form :model="qaForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="qaForm.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="qaForm.content" type="textarea" :rows="4" />
        </el-form-item>
        
        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            :headers="headers"
            :show-file-list="false"
            :on-success="handleQaUploadSuccess"
          >
            <el-button size="small" type="primary" icon="Plus">点击上传</el-button>
          </el-upload>

          <div class="custom-file-list" v-if="qaForm.fileUrls && qaForm.fileUrls.length > 0">
            <div v-for="(url, index) in qaForm.fileUrls" :key="index" class="custom-file-item">
              
              <div v-if="isImage(url)" class="img-wrapper">
                <el-image 
                  :src="url" 
                  :preview-src-list="qaForm.fileUrls"
                  :initial-index="index"
                  fit="cover"
                  class="upload-thumb"
                />
                <div class="img-remove" @click="removeQaFile(index)">
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
                  <el-button link type="danger" @click="removeQaFile(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

            </div>
          </div>
        </el-form-item>
        </el-form>
      <template #footer>
        <el-button @click="qaEditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQaUpdate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="qaViewVisible" title="问题及回答详情" width="700px">
      <div v-if="currentQa" class="qa-detail-view">
        <div class="q-part">
          <h3>{{ currentQa.title }}</h3>
          <p class="content-text">{{ currentQa.content }}</p>
          
          <div v-if="currentQa.fileUrls && currentQa.fileUrls.length" class="file-list-container">
             <template v-for="(url, i) in currentQa.fileUrls" :key="i">
                <el-image 
                    v-if="isImage(url)"
                    :src="url" :preview-src-list="currentQa.fileUrls"
                    class="thumb" fit="cover"
                />
                <div v-else class="file-item-box">
                    <el-icon><Document /></el-icon>
                    <span class="file-name-text" :title="getFileName(url)">{{ getFileName(url) }}</span>
                    <el-button link type="primary" @click="downloadFile(url)">下载</el-button>
                </div>
             </template>
          </div>
        </div>
        
        <el-divider>老师回答</el-divider>
        
        <div v-if="!currentQa.answers || currentQa.answers.length === 0" class="no-answer">
          <el-empty description="暂无回答" :image-size="80"></el-empty>
        </div>
        
        <div v-else class="answer-list">
          <div v-for="ans in currentQa.answers" :key="ans.id" class="answer-item">
            <div class="a-header">
              <span class="teacher-tag">{{ ans.teacherName }} 老师</span>
              <span class="time">{{ ans.createTime }}</span>
            </div>
            <div class="a-content">{{ ans.content }}</div>
            
            <div v-if="ans.fileUrls && ans.fileUrls.length" class="file-list-container small">
               <template v-for="(url, j) in ans.fileUrls" :key="j">
                  <el-image 
                      v-if="isImage(url)"
                      :src="url" :preview-src-list="ans.fileUrls"
                      class="thumb" fit="cover"
                  />
                  <div v-else class="file-item-box">
                      <el-icon><Link /></el-icon>
                      <span class="file-name-text" :title="getFileName(url)">{{ getFileName(url) }}</span>
                      <el-button link type="primary" @click="downloadFile(url)">下载</el-button>
                  </div>
               </template>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import studentResourceApi from '@/api/studentResource'
import qaApi from '@/api/qa'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Link, Download, Delete, CircleCloseFilled } from '@element-plus/icons-vue'

const headers = { token: localStorage.getItem('token') || '' }
const activeTab = ref('resource')

// ================= 资源模块 =================
const resLoading = ref(false)
const resList = ref([])
const resTotal = ref(0)
const resQuery = reactive({ page: 1, pageSize: 10, keyword: '' })

// 编辑资源状态
const resDialogVisible = ref(false)
const resForm = reactive({ id: null, title: '', description: '', visibility: 'class_only', fileUrls: [] })

// ================= 问答模块 =================
const qaLoading = ref(false)
const qaList = ref([])
const qaTotal = ref(0)
const qaQuery = reactive({ page: 1, pageSize: 10, keyword: '', status: null })

// 编辑/查看问答状态
const qaEditVisible = ref(false)
const qaViewVisible = ref(false)
const currentQa = ref(null)
const qaForm = reactive({ id: null, title: '', content: '', fileUrls: [] })

// 通用文件列表（用于上传组件回显）
const fileList = ref([])

onMounted(() => {
  fetchResources()
})

const handleTabClick = (tab) => {
  if (tab.paneName === 'resource') fetchResources()
  else fetchQuestions()
}

// ---------------- 资源逻辑 ----------------
const fetchResources = async () => {
  resLoading.value = true
  try {
    const res = await studentResourceApi.getMyResources(resQuery)
    if(res.code === 1) {
      resList.value = res.data.list
      resTotal.value = res.data.total
    }
  } finally {
    resLoading.value = false
  }
}

const openResEdit = (row) => {
  resForm.id = row.id
  resForm.title = row.title
  resForm.description = row.description
  resForm.visibility = row.visibility
  resForm.fileUrls = row.fileUrls || []
  
  // 回显文件
  fileList.value = resForm.fileUrls.map((url, i) => ({ name: `附件${i+1}`, url }))
  resDialogVisible.value = true
}

const handleResRemove = (file) => {
  const url = file.response ? file.response.data : file.url
  resForm.fileUrls = resForm.fileUrls.filter(u => u !== url)
}

const submitResUpdate = async () => {
  if(!resForm.title) return ElMessage.warning('标题不能为空')
  await studentResourceApi.updateResource(resForm)
  ElMessage.success('修改成功')
  resDialogVisible.value = false
  fetchResources()
}

const handleResDelete = (row) => {
  ElMessageBox.confirm('确定删除该资源吗？', '提示', { type: 'warning' }).then(async () => {
    await studentResourceApi.deleteResource(row.id)
    ElMessage.success('已删除')
    fetchResources()
  })
}

// ---------------- 问答逻辑 ----------------
const fetchQuestions = async () => {
  qaLoading.value = true
  try {
    const res = await qaApi.getMyQuestions(qaQuery)
    if(res.code === 1) {
      qaList.value = res.data.list
      qaTotal.value = res.data.total
    }
  } finally {
    qaLoading.value = false
  }
}

const openViewAnswers = (row) => {
  currentQa.value = row
  qaViewVisible.value = true
}

const openQaEdit = (row) => {
  qaForm.id = row.id
  qaForm.title = row.title
  qaForm.content = row.content
  // 复制一份数组，防止直接修改原数据
  qaForm.fileUrls = row.fileUrls ? [...row.fileUrls] : []
  
  qaEditVisible.value = true
}

const handleQaUploadSuccess = (res) => {
  if(res.code === 1) {
    qaForm.fileUrls.push(res.data)
  }
}
const handleQaRemove = (file) => {
  const url = file.response ? file.response.data : file.url
  qaForm.fileUrls = qaForm.fileUrls.filter(u => u !== url)
}

const submitQaUpdate = async () => {
  if(!qaForm.title || !qaForm.content) return ElMessage.warning('标题和内容不能为空')
  await qaApi.updateQuestion(qaForm)
  ElMessage.success('修改成功')
  qaEditVisible.value = false
  fetchQuestions()
}

const handleQaDelete = (row) => {
  ElMessageBox.confirm('确定删除该提问吗？', '提示', { type: 'warning' }).then(async () => {
    await qaApi.deleteQuestion(row.id)
    ElMessage.success('已删除')
    fetchQuestions()
  })
}

// ==================== 【新增】文件处理工具函数 ====================
// 1. 判断是否是图片
const isImage = (url) => {
  if (!url) return false
  const ext = url.substring(url.lastIndexOf('.')).toLowerCase()
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  return imageExtensions.includes(ext)
}

// 2. 从URL提取文件名
const getFileName = (url) => {
  if (!url) return '未知文件'
  let fileName = url.substring(url.lastIndexOf('/') + 1)
  fileName = fileName.split('?')[0]
  try {
    return decodeURIComponent(fileName)
  } catch (e) {
    return fileName
  }
}

// 3. 下载函数
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

//4. 【新增】删除资源文件的函数 (用于编辑弹窗)
const removeResFile = (index) => {
  resForm.fileUrls.splice(index, 1)
}

// 5. 【修改】handleResUploadSuccess 直接操作 resForm.fileUrls
const handleResUploadSuccess = (res) => {
  if(res.code === 1) {
    resForm.fileUrls.push(res.data)
  }
}

// 1. 【新增】删除问题附件的函数 (用于编辑弹窗)
const removeQaFile = (index) => {
  qaForm.fileUrls.splice(index, 1)
}
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}
.pagination-container {
  text-align: right;
  margin-top: 15px;
}
.qa-detail-view {
  padding: 0 10px;
}
.q-part h3 {
  margin-top: 0;
  color: #303133;
}
.content-text {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}
.img-list {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.thumb {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #eee;
}
.answer-list {
  background: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
}
.answer-item {
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.a-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #909399;
}
.teacher-tag {
  color: #409EFF;
  font-weight: bold;
}
.a-content {
  color: #303133;
  line-height: 1.6;
}
/* 自定义文件列表容器 */
.custom-file-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 图片包装器 */
.img-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  overflow: visible; /* 允许删除按钮溢出 */
}

.upload-thumb {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

/* 图片删除按钮 */
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

/* 普通文件包装器 */
.file-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%; /* 或者固定宽度，看需求 */
  max-width: 380px;
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