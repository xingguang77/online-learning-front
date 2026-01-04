<template>
  <div class="resource-container">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="关键词">
          <el-input 
            v-model="queryParams.keyword" 
            placeholder="搜资源名称/简介" 
            clearable 
            @keyup.enter="handleQuery"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item label="课程" v-if="!props.courseId">
          <el-select 
            v-model="queryParams.courseId" 
            placeholder="全部课程" 
            clearable 
            style="width: 160px"
            @change="handleQuery">
            <el-option
              v-for="c in courseOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>

        <el-form-item style="float: right; margin-right: 0;">
          <el-button type="primary" icon="Upload" @click="openUploadDialog">上传资料</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 15px;">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="title" label="资源名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="简介" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="courseName" label="所属课程" width="150" align="center" v-if="!props.courseId" />
        
        <el-table-column prop="uploaderName" label="上传者" width="120" align="center" />
        <el-table-column prop="downloadCount" label="下载量" width="100" align="center" />
        <el-table-column prop="createTime" label="上传时间" width="170" align="center" />
        <el-table-column label="附件/下载" min-width="150" align="center" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.fileUrls && scope.row.fileUrls.length > 0">
              <div v-for="(url, index) in scope.row.fileUrls" :key="index" style="margin-bottom: 5px;">
                <template v-if="isImage(url)">
                  <el-image 
                    :src="url" 
                    :preview-src-list="scope.row.fileUrls" 
                    :initial-index="index"
                    style="width: 40px; height: 40px; border-radius: 4px; border: 1px solid #eee; cursor: pointer;" 
                    fit="cover"
                  />
                </template>
                <template v-else>
                  <el-button type="primary" link icon="Download" @click="downloadFile(url)">
                    {{ getFileName(url) }}
                  </el-button>
                </template>
              </div>
            </div>
            <span v-else style="color: #999; font-size: 12px;">无附件</span>
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

    <el-dialog v-model="uploadVisible" title="上传学习资料" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="所属班级" v-if="!props.classId">
          <el-select v-model="uploadForm.classId" placeholder="请选择上传到的班级" style="width: 100%">
            <el-option 
              v-for="c in classOptions" 
              :key="c.id" 
              :label="`${c.courseName} - ${c.className}`" 
              :value="c.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题">
          <el-input v-model="uploadForm.title" placeholder="请输入资源标题" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="简要介绍资源内容" />
        </el-form-item>
        <el-form-item label="可见性">
          <el-radio-group v-model="uploadForm.visibility">
            <el-radio :label="0">仅本班可见</el-radio>
            <el-radio :label="1">全站公开</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            action="/api/upload"
            :headers="headers"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :limit="5">
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF, Word, 图片等格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload">确定上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import studentResourceApi from '@/api/studentResource'
import studentCourseApi from '@/api/studentCourse'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

const headers = { token: localStorage.getItem('token') || '' }

// === 1. 接收 props ===
const props = defineProps({
  courseId: { type: Number, default: null }, // 用于筛选显示
  classId: { type: Number, default: null }   // 用于上传时自动填充
})

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const courseOptions = ref([]) // 用于筛选
const classOptions = ref([])  // 用于上传

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  courseId: null
})

const uploadVisible = ref(false)
const uploadForm = reactive({
  title: '',
  description: '',
  classId: null,
  visibility: 0,
  fileUrls: []
})
const fileList = ref([])

onMounted(async () => {
  // 如果有 props，优先使用 props 里的筛选条件
  if (props.courseId) {
    queryParams.courseId = props.courseId
  } else {
    // 全站模式：加载课程选项供筛选
    await loadOptions()
  }
  getList()
})

// ==================== 新增工具函数 ====================

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
  fileName = fileName.split('?')[0] // 去除OSS等URL后的参数
  try {
    return decodeURIComponent(fileName) // 处理中文文件名
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
// ======================================================

const loadOptions = async () => {
  const res = await studentCourseApi.getMyClasses()
  if(res.code === 1) {
    // 1. 处理 classOptions (上传用)
    classOptions.value = res.data // 直接用 ClazzVO 列表
    
    // 2. 处理 courseOptions (筛选用) - 去重
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
    const res = await studentResourceApi.getList(queryParams)
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
  if (!props.courseId) {
    queryParams.courseId = null
  }
  handleQuery()
}

// === 上传逻辑 ===
const openUploadDialog = async () => {
  // 如果 classOptions 还没加载且需要用（非嵌入模式），加载一下
  if (!props.classId && classOptions.value.length === 0) {
    await loadOptions()
  }

  // 重置表单
  uploadForm.title = ''
  uploadForm.description = ''
  uploadForm.visibility = 0
  uploadForm.fileUrls = []
  fileList.value = []
  
  // 自动填充班级
  if (props.classId) {
    uploadForm.classId = props.classId
  } else {
    uploadForm.classId = null
  }
  
  uploadVisible.value = true
}

const submitUpload = async () => {
  if(!uploadForm.title) return ElMessage.warning('请输入标题')
  if(!uploadForm.classId) return ElMessage.warning('请选择所属班级')
  
  await studentResourceApi.upload(uploadForm)
  ElMessage.success('上传成功')
  uploadVisible.value = false
  getList()
}

const handleUploadSuccess = (res) => {
  if(res.code === 1) uploadForm.fileUrls.push(res.data)
}
const handleRemove = (file) => {
  const url = file.response ? file.response.data : file.url
  uploadForm.fileUrls = uploadForm.fileUrls.filter(u => u !== url)
}

const handleDownload = (row) => {
  if (row.fileUrls && row.fileUrls.length > 0) {
    // 简单处理：打开第一个文件，或者弹窗显示列表
    // 这里为了演示直接打开第一个
    window.open(row.fileUrls[0], '_blank')
    // 可以在后台记录下载次数
    studentResourceApi.recordDownload(row.id)
  } else {
    ElMessage.info('该资源暂无附件')
  }
}
</script>

<style scoped>
/* 样式与 QAList 类似，保持风格统一 */
</style>