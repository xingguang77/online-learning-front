<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="关键词">
          <el-input 
            v-model="queryParams.keyword" 
            placeholder="搜标题 / 内容 / 课程名 / 学生" 
            clearable 
            @keyup.enter="handleQuery"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px" @change="handleQuery">
            <el-option label="待解决" :value="0" />
            <el-option label="已解决" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px;">
      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="title" label="问题标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="问题详情" min-width="250" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.content">{{ scope.row.content }}</span>
            <span v-else style="color: #909399;">无详细描述</span>
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="所属课程" width="150" align="center" />
        <el-table-column prop="studentName" label="提问学生" width="120" align="center" />
        <el-table-column prop="createTime" label="提问时间" width="170" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
              {{ scope.row.status === 1 ? '已解决' : '待解决' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="openDetailDialog(scope.row)">管理回答/详情</el-button>
            <el-button type="primary" link @click="openEditQuestion(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDeleteQuestion(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="问题详情与回答管理" width="800px">
      <div v-if="currentDetail" v-loading="detailLoading">
        
        <div class="question-info">
          <h3>{{ currentDetail.title }}</h3>
          <div class="q-meta">
            <span>学生：{{ currentDetail.studentName }}</span>
            <span>时间：{{ currentDetail.createTime }}</span>
          </div>
          <p class="q-content">{{ currentDetail.content }}</p>
          
          <div v-if="currentDetail.fileUrls && currentDetail.fileUrls.length" class="attach-container">
            <p style="font-weight: bold; margin-bottom: 8px;">附件列表：</p>
            <div class="custom-file-list">
              <div v-for="(url, i) in currentDetail.fileUrls" :key="i" class="custom-file-item">
                <div v-if="isImage(url)" class="img-wrapper no-border">
                  <el-image 
                    :src="url" 
                    :preview-src-list="currentDetail.fileUrls"
                    :initial-index="i"
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
                      <el-icon><Download /></el-icon> 下载
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-divider>回答列表 ({{ currentDetail.answers ? currentDetail.answers.length : 0 }})</el-divider>

        <el-table :data="currentDetail.answers" border stripe style="width: 100%">
          <el-table-column prop="teacherName" label="回答教师" width="120" />
          <el-table-column prop="content" label="回答内容" show-overflow-tooltip />
          
          <el-table-column label="附件" width="100" align="center">
            <template #default="scope">
              <div v-if="scope.row.fileUrls && scope.row.fileUrls.length">
                <el-popover placement="left" :width="320" trigger="hover">
                  <template #reference>
                    <el-tag effect="plain" style="cursor: pointer">
                      {{ scope.row.fileUrls.length }} 个附件
                    </el-tag>
                  </template>
                  <div class="custom-file-list">
                    <div v-for="(url, idx) in scope.row.fileUrls" :key="idx" class="custom-file-item">
                      <div v-if="isImage(url)" class="img-wrapper no-border">
                        <el-image 
                          :src="url" 
                          :preview-src-list="scope.row.fileUrls"
                          :initial-index="idx"
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
                </el-popover>
              </div>
              <span v-else style="color:#ccc">无</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="时间" width="160" />
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="openEditAnswer(scope.row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDeleteAnswer(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="editVisible" :title="editTitle" width="600px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="标题" v-if="editType === 'question'">
          <el-input v-model="editForm.title" />
        </el-form-item>
        
        <el-form-item label="内容">
          <el-input v-model="editForm.content" type="textarea" :rows="5" />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            :headers="headers"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
          >
            <el-button size="small" type="primary" icon="Plus">点击上传</el-button>
          </el-upload>

          <div class="custom-file-list" v-if="editForm.fileUrls && editForm.fileUrls.length > 0">
            <div v-for="(url, index) in editForm.fileUrls" :key="index" class="custom-file-item">
              
              <div v-if="isImage(url)" class="img-wrapper">
                <el-image 
                  :src="url" 
                  :preview-src-list="editForm.fileUrls"
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
          
          <div style="font-size: 12px; color: #999; margin-top: 8px; width: 100%;">
            支持上传图片及文档。非图片文件可直接下载。
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import adminQaApi from '@/api/adminQA'
import { ElMessage, ElMessageBox } from 'element-plus'
// 引入所需图标
import { Plus, Document, Download, Delete, CircleCloseFilled } from '@element-plus/icons-vue' 

const headers = { token: localStorage.getItem('token') || '' }

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

// === 数据定义 ===
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: null
})
const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref(null)
const editVisible = ref(false)
const editType = ref('question') 
const editForm = reactive({
  id: null,
  title: '',
  content: '',
  fileUrls: []
})
const editTitle = computed(() => editType.value === 'question' ? '编辑问题内容' : '编辑回答内容')

onMounted(() => {
  getList()
})

const getList = async () => {
  loading.value = true
  try {
    const res = await adminQaApi.getList(queryParams)
    if (res.code === 1) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  getList()
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.status = null
  handleQuery()
}

// ... (删除/详情逻辑) ...
const handleDeleteQuestion = (row) => {
  ElMessageBox.confirm('确定删除该问题吗？', '严重警告', { type: 'error' }).then(async () => {
    await adminQaApi.deleteQuestion(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

const openDetailDialog = async (row) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await adminQaApi.getQuestionDetail(row.id)
    if(res.code === 1) {
      currentDetail.value = res.data
    }
  } finally {
    detailLoading.value = false
  }
}

const handleDeleteAnswer = (ansRow) => {
  ElMessageBox.confirm('确定删除这条回答吗？', '提示', { type: 'warning' }).then(async () => {
    await adminQaApi.deleteAnswer(ansRow.id)
    ElMessage.success('已删除')
    if (currentDetail.value) {
      const res = await adminQaApi.getQuestionDetail(currentDetail.value.id)
      currentDetail.value = res.data
    }
  })
}

// ... (编辑逻辑) ...
const openEditQuestion = (row) => {
  editType.value = 'question'
  loadDataForEdit(row.id, adminQaApi.getQuestionDetail)
}

const openEditAnswer = (ansRow) => {
  editType.value = 'answer'
  loadDataForEdit(ansRow.id, adminQaApi.getAnswer)
}

const loadDataForEdit = async (id, apiMethod) => {
  const res = await apiMethod(id)
  if(res.code === 1) {
    const data = res.data
    editForm.id = data.id
    editForm.content = data.content
    editForm.title = ''
    // 复制数组，防止引用问题
    editForm.fileUrls = data.fileUrls ? [...data.fileUrls] : []

    if(editType.value === 'question') {
      editForm.title = data.title
    }
    
    editVisible.value = true
  }
}

const submitEdit = async () => {
  if(!editForm.content) return ElMessage.warning('内容不能为空')
  
  if (editType.value === 'question') {
    if(!editForm.title) return ElMessage.warning('标题不能为空')
    await adminQaApi.updateQuestion(editForm)
    ElMessage.success('问题更新成功')
    getList() 
  } else {
    const answerPayload = {
      id: editForm.id,
      content: editForm.content,
      fileUrls: editForm.fileUrls
    }
    await adminQaApi.updateAnswer(answerPayload)
    ElMessage.success('回答更新成功')
    if (detailVisible.value && currentDetail.value) {
      const res = await adminQaApi.getQuestionDetail(currentDetail.value.id)
      currentDetail.value = res.data
    }
  }
  editVisible.value = false
}

// 上传成功
const handleUploadSuccess = (res) => {
  if(res.code === 1) editForm.fileUrls.push(res.data)
}

// 手动删除文件
const removeFile = (index) => {
  editForm.fileUrls.splice(index, 1)
}
</script>

<style scoped>
.filter-card { margin-bottom: 20px; }
.question-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
.question-info h3 { margin-top: 0; color: #303133; }
.q-meta { font-size: 13px; color: #909399; margin-bottom: 10px; display: flex; gap: 20px; }
.q-content { line-height: 1.6; color: #606266; }
.attach-container { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #e0e0e0; }

/* 复用之前定义的样式 */
.custom-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.img-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
/* 查看模式下图片不需要边框(可选) */
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
  max-width: 320px;
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