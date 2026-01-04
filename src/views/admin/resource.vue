<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="资源标题">
          <el-input v-model="queryParams.keyword" placeholder="请输入关键词" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px;">
      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        
        <el-table-column prop="title" label="资源标题" width="180" show-overflow-tooltip />
        
        <el-table-column prop="description" label="资源描述" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.description">{{ scope.row.description }}</span>
            <span v-else style="color: #909399;">暂无描述</span>
          </template>
        </el-table-column>

        <el-table-column prop="courseName" label="所属课程" width="120" />
        <el-table-column prop="uploaderName" label="上传人" width="100" />
        <el-table-column prop="uploaderRole" label="角色" width="80">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.uploaderRole === 'teacher' ? 'success' : 'info'">
              {{ scope.row.uploaderRole === 'teacher' ? '教师' : '学生' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="附件" width="100" align="center">
          <template #default="scope">
             <el-button type="primary" link @click="handleViewFiles(scope.row)">
               查看({{ scope.row.fileUrls ? scope.row.fileUrls.length : 0 }})
             </el-button>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="上传时间" width="160" />

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right;">
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

    <el-dialog v-model="editDialogVisible" title="编辑资源信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="filesDialogVisible" title="资源附件列表" width="600px">
      <el-table :data="currentFileList" border>
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="附件预览/下载">
          <template #default="scope">
            <el-link :href="scope.row" target="_blank" type="primary" :underline="false">
              {{ decodeURIComponent(scope.row.split('/').pop()) }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="scope">
            <el-link :href="scope.row" target="_blank" type="primary">下载</el-link>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import adminResourceApi from '@/api/adminResource'
import { ElMessage, ElMessageBox } from 'element-plus'

// 数据定义
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

// 编辑弹窗
const editDialogVisible = ref(false)
const editForm = reactive({
  id: null,
  title: '',
  description: ''
})

// 附件弹窗
const filesDialogVisible = ref(false)
const currentFileList = ref([])

// 初始化
onMounted(() => {
  getList()
})

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    const res = await adminResourceApi.getList(queryParams)
    if (res.code === 1) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

// 查询操作
const handleQuery = () => {
  queryParams.page = 1
  getList()
}

// 重置操作
const resetQuery = () => {
  queryParams.keyword = ''
  handleQuery()
}

// 打开编辑
const handleEdit = (row) => {
  editForm.id = row.id
  editForm.title = row.title
  editForm.description = row.description
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if(!editForm.title) return ElMessage.warning('标题不能为空')
  await adminResourceApi.updateContent(editForm)
  ElMessage.success('更新成功')
  editDialogVisible.value = false
  getList()
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该资源吗？此操作不可恢复。', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'error'
  }).then(async () => {
    await adminResourceApi.deleteResource(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

// 查看附件
const handleViewFiles = (row) => {
  currentFileList.value = row.fileUrls || []
  filesDialogVisible.value = true
}
</script>

<style scoped>
.search-card {
  margin-bottom: 20px;
}
</style>