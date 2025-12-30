<template>
  <div class="app-container">
    <el-card class="box-card" style="max-width: 800px; margin: 0 auto;">
      <template #header>
        <div class="card-header">
          <span>发布教学资源</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="120px" ref="formRef" :rules="rules">
        <el-form-item label="资源标题" prop="title">
          <el-input v-model="form.title" placeholder="例如：第一章 课后复习资料" />
        </el-form-item>
        
        <el-form-item label="发布班级" prop="classId">
          <el-select v-model="form.classId" placeholder="请选择发布班级" @change="handleClassChange" style="width: 100%">
            <el-option 
              v-for="item in classOptions" 
              :key="item.id" 
              :label="item.className" 
              :value="item.id" 
            />
          </el-select>
          <div class="tip-text" v-if="form.courseId">所属课程ID：{{ form.courseId }}</div>
        </el-form-item>

        <el-form-item label="资源描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入资源简介..." />
        </el-form-item>

        <el-form-item label="可见性" prop="visibility">
          <el-radio-group v-model="form.visibility">
            <el-radio :label="1">仅本班可见</el-radio>
            <el-radio :label="0">对所有修读该课程的学生可见</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="上传附件">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            drag
            action="/api/upload" 
            :headers="headers"
            multiple
            :on-success="handleSuccess"
            :on-remove="handleRemove">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF, Word, PPT, 图片等格式</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit" :loading="loading">立即发布</el-button>
          <el-button @click="$router.back()">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import teacherApi from '@/api/teacher'
import { ElMessage } from 'element-plus'

const headers = { token: localStorage.getItem('token') || '' }
const loading = ref(false)
const classOptions = ref([])
// 2. 定义 uploadRef
const uploadRef = ref(null)
const formRef = ref(null) // 1. 定义表单引用
const form = reactive({
  title: '',
  description: '',
  classId: null,
  courseId: null,
  visibility: 'class_only', // 默认值
  fileUrls: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }]
}

onMounted(async () => {
  const res = await teacherApi.getMyClasses()
  if (res.code === 1) {
    classOptions.value = res.data.map(item => item.classInfo)
  }
})

// 选择班级后自动关联课程ID
const handleClassChange = (val) => {
  const selected = classOptions.value.find(c => c.id === val)
  if(selected) {
    form.courseId = selected.courseId
  }
}

// 上传成功收集URL
const handleSuccess = (res) => {
  if(res.code === 1) {
    form.fileUrls.push(res.data)
  }
}

const handleRemove = (file) => {
  const url = file.response ? file.response.data : file.url
  form.fileUrls = form.fileUrls.filter(u => u !== url)
}

const onSubmit = async () => {
  if (!form.title || !form.classId) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  loading.value = true
  try {
    await teacherApi.publishResource(form)
    ElMessage.success('发布成功')
    
    // === 3. 核心修改：发布成功后重置表单 ===
    resetForm()

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 重置表单方法
const resetForm = () => {
  // 1. 清空数据模型
  form.title = ''
  form.description = ''
  form.classId = null
  form.courseId = null
  form.visibility = 'class_only'
  form.fileUrls = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
  // 2. 清空上传组件的文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}
</script>

<style scoped>
.tip-text {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}
</style>