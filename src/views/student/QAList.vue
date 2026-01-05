<template>
  <div class="qa-container">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="关键词">
          <el-input 
            v-model="queryParams.keyword" 
            placeholder="搜标题/内容/回答/教师" 
            clearable 
            @keyup.enter="handleQuery"
            style="width: 240px" 
          />
        </el-form-item>

        <el-form-item label="教师">
          <el-input 
            v-model="queryParams.teacherName" 
            placeholder="搜负责教师" 
            clearable 
            @keyup.enter="handleQuery"
            style="width: 140px" 
          />
        </el-form-item>

        <el-form-item label="课程" v-if="!props.courseId">
          <el-select 
            v-model="queryParams.courseId" 
            placeholder="全部课程" 
            clearable 
            @change="handleQuery"
            style="width: 160px">
            <el-option
              v-for="c in courseOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
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

        <el-form-item style="float: right; margin-right: 0;">
          <el-button type="success" icon="Edit" @click="openAskDialog">我要提问</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 15px;">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="title" label="问题标题" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="link-type" @click="handleDetail(scope.row)">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="courseName" label="所属课程" width="150" align="center" v-if="!props.courseId" />
        <el-table-column prop="teacherName" label="负责教师" width="120" align="center">
          <template #default="scope">
            {{ formatTeacherNames(scope.row.answers) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提问时间" width="170" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
              {{ scope.row.status === 1 ? '已解决' : '待解决' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleDetail(scope.row)">查看详情</el-button>
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

    <el-dialog v-model="askVisible" title="提出新问题" width="600px" :close-on-click-modal="false">
      <el-form :model="askForm" label-width="80px">
        <el-form-item label="选择课程" v-if="!props.courseId">
          <el-select v-model="askForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标题">
          <el-input v-model="askForm.title" placeholder="简明扼要描述问题" />
        </el-form-item>
        
        <el-form-item label="详情">
          <el-input 
            v-model="askForm.content" 
            type="textarea" 
            :rows="5" 
            placeholder="请详细描述您的问题..." 
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            :headers="headers"
            v-model:file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :on-preview="handlePreview"
          >
            <el-button type="primary" icon="Upload">点击上传附件</el-button>
            
            <template #tip>
              <div class="el-upload__tip">
                支持图片、文档等格式，点击文件名可预览或下载
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="askVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAsk">提交问题</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="问答详情" width="700px">
      <div v-if="currentDetail">
        <div class="q-part">
          <h3>{{ currentDetail.title }}</h3>
          <div style="font-size: 12px; color: #999; margin-bottom: 10px;">
            <span>{{ currentDetail.courseName }}</span> | <span>{{ currentDetail.studentName || '我' }}</span> | <span>{{ currentDetail.createTime }}</span>
          </div>
          <p style="white-space: pre-wrap; line-height: 1.6;">{{ currentDetail.content }}</p>
          
          <div v-if="currentDetail.fileUrls && currentDetail.fileUrls.length" class="file-list-container">
             <template v-for="(url, i) in currentDetail.fileUrls" :key="i">
                <el-image 
                    v-if="isImage(url)"
                    :src="url" :preview-src-list="currentDetail.fileUrls"
                    style="width: 100px; height: 100px; border-radius: 4px; border: 1px solid #eee; margin-right: 8px;" 
                    fit="cover"
                />
                <div v-else class="file-item-box">
                    <el-icon><Document /></el-icon>
                    <span class="file-name-text" :title="getFileName(url)">{{ getFileName(url) }}</span>
                    <el-button link type="primary" @click="downloadFile(url)">下载</el-button>
                </div>
             </template>
          </div>
        </div>

        <el-divider>回答区</el-divider>

        <div v-if="!currentDetail.answers || currentDetail.answers.length === 0">
          <el-empty description="暂无回答，请耐心等待老师回复" :image-size="60"></el-empty>
        </div>
        <div v-else>
          <div v-for="ans in currentDetail.answers" :key="ans.id" style="background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 4px;">
            <div style="margin-bottom: 5px; font-weight: bold; color: #409EFF;">
              {{ ans.teacherName || '老师' }} <span v-if="ans.teacherName">老师</span>
              <span style="float: right; color: #999; font-weight: normal; font-size: 12px;">{{ ans.createTime }}</span>
            </div>
            <div style="line-height: 1.6; color: #303133;">{{ ans.content }}</div>
            
            <div v-if="ans.fileUrls && ans.fileUrls.length" class="file-list-container small">
               <template v-for="(url, j) in ans.fileUrls" :key="j">
                  <el-image 
                      v-if="isImage(url)"
                      :src="url" :preview-src-list="ans.fileUrls"
                      style="width: 80px; height: 80px; border-radius: 4px; border: 1px solid #eee; margin-right: 8px;" 
                      fit="cover"
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
    
    <el-dialog v-model="previewVisible">
      <img w-full :src="previewUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import qaApi from '@/api/qa'
import studentCourseApi from '@/api/studentCourse'
import { ElMessage } from 'element-plus'
// 【修复】引入 Upload 图标
import { Plus, Edit, Link, Document, Upload } from '@element-plus/icons-vue'

const route = useRoute()
const headers = { token: localStorage.getItem('token') || '' }

const props = defineProps({
  courseId: { type: Number, default: null } 
})

// === 数据定义 ===
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const courseOptions = ref([]) 

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  teacherName: '',
  courseId: null,
  status: null
})

// 提问表单
const askVisible = ref(false)
const askForm = reactive({ title: '', content: '', courseId: null, fileUrls: [] })
const fileList = ref([])

// 详情查看
const detailVisible = ref(false)
const currentDetail = ref(null)

// 预览
const previewVisible = ref(false)
const previewUrl = ref('')

// === 方法定义 (注意顺序：先定义被调用的函数) ===

// 1. 打开详情弹窗
const handleDetail = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

// 2. 根据ID检查并打开详情 (用于通知跳转)
const checkAndOpenDetail = async (id) => {
  if (!id) return
  const targetId = Number(id)
  
  // 1. 尝试在当前列表找
  const targetRow = tableData.value.find(q => q.id === targetId)
  
  if (targetRow) {
    handleDetail(targetRow)
  } else {
    // 2. 列表里没找到，单独调接口查
    try {
      const res = await qaApi.getDetail(targetId)
      if (res.code === 1) {
        currentDetail.value = res.data
        detailVisible.value = true
      }
    } catch(e) {
      console.error('自动打开详情失败', e)
    }
  }
}

// === 生命周期与监听 ===

onMounted(async () => {
  // 1. 处理课程筛选参数
  if (props.courseId) {
    queryParams.courseId = props.courseId
  } else {
    await loadCourseOptions()
  }
  
  // 2. 获取列表
  await getList()

  // 3. 检查路由参数 (如果是从通知跳转进来的)
  if (route.query.id) {
    checkAndOpenDetail(route.query.id)
  }
})

// 4. 监听路由变化 (解决在当前页面点击通知不刷新的问题)
watch(() => route.query.id, (newId) => {
  if (newId) {
    checkAndOpenDetail(newId)
  }
})

// === 业务逻辑函数 ===

const loadCourseOptions = async () => {
  const res = await studentCourseApi.getMyClasses() 
  if(res.code === 1) {
    const map = new Map()
    res.data.forEach(item => {
      if(!map.has(item.courseId)) {
        map.set(item.courseId, { id: item.courseId, name: item.courseName })
      }
    })
    courseOptions.value = Array.from(map.values())
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await qaApi.getList(queryParams)
    if(res.code === 1) {
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
  queryParams.teacherName = ''
  queryParams.status = null
  if (!props.courseId) {
    queryParams.courseId = null
  }
  handleQuery()
}

const openAskDialog = () => {
  askForm.title = ''
  askForm.content = ''
  askForm.fileUrls = []
  fileList.value = []
  if (props.courseId) {
    askForm.courseId = props.courseId
  } else {
    askForm.courseId = null
  }
  askVisible.value = true
}

const submitAsk = async () => {
  if (!askForm.title || !askForm.content) return ElMessage.warning('请填写标题和内容')
  if (!askForm.courseId) return ElMessage.warning('请选择提问的课程')
  
  await qaApi.addQuestion(askForm)
  ElMessage.success('提问成功，等待老师回答')
  askVisible.value = false
  getList()
}

// 格式化教师姓名
const formatTeacherNames = (answers) => {
  if (!answers || answers.length === 0) return '-'
  const names = answers.map(item => item.teacherName).filter(name => name)
  const uniqueNames = [...new Set(names)]
  if (uniqueNames.length === 0) return '老师'
  return uniqueNames.join('、')
}

// 附件上传相关
const handleUploadSuccess = (res) => {
  if(res.code === 1) askForm.fileUrls.push(res.data)
}
const handleRemove = (file) => {
  const url = file.response ? file.response.data : file.url
  askForm.fileUrls = askForm.fileUrls.filter(u => u !== url)
}
const handlePreview = (uploadFile) => {
  const fileUrl = uploadFile.response ? uploadFile.response.data : uploadFile.url
  if (!fileUrl) return
  if (isImage(fileUrl)) {
    previewUrl.value = fileUrl
    previewVisible.value = true
  } else {
    downloadFile(fileUrl)
  }
}

// 工具函数
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
</script>

<style scoped>
.link-type { color: #409EFF; cursor: pointer; }
.link-type:hover { text-decoration: underline; }
.q-part h3 { margin-top: 0; color: #303133; }

/* 附件样式 */
.file-list-container {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.file-item-box {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  background-color: #f0f2f5;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  max-width: 260px; 
}
.file-name-text {
  margin: 0 8px;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.file-item-box .el-icon {
  font-size: 16px;
  color: #909399;
}
</style>