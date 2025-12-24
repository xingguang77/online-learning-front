<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getCourseList, addCourse, updateCourse, deleteCourse } from '@/api/course'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// --- 状态定义 ---
const loading = ref(false)
const courseList = ref([])
const total = ref(0)
const submitLoading = ref(false)

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: ''
})

// 弹窗控制
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单对象
const form = reactive({
  id: undefined,
  name: '',
  college: '',
  description: ''
})

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  college: [{ required: true, message: '请选择开课学院', trigger: 'change' }]
}

const courseFormRef = ref(null)

// --- 生命周期 ---
onMounted(() => {
  fetchData()
})

// --- 方法 ---

// 1. 获取数据列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCourseList(queryParams)
    console.log(res)
    if (res.code === 1) {
      courseList.value = res.data.rows
      console.log(courseList.value)
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 2. 搜索
const handleQuery = () => {
  queryParams.page = 1
  fetchData()
}

// 新增：重置搜索条件
const resetQuery = () => {
  queryParams.name = ''   // 清空课程名称输入框
  queryParams.page = 1    // 重置到第一页
  fetchData()             // 刷新列表数据
}
// 3. 打开新增弹窗
const handleCreate = () => {
  resetForm()
  dialog.title = '新增课程'
  dialog.visible = true
}

// 4. 打开编辑弹窗
const handleEdit = (row) => {
  resetForm()
  dialog.title = '编辑课程'
  dialog.visible = true
  // 数据回显
  nextTick(() => {
    Object.assign(form, row)
  })
}

// 5. 提交表单
const submitForm = async () => {
  if (!courseFormRef.value) return
  
  await courseFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (form.id) {
          // 修改
          await updateCourse(form)
          ElMessage.success('修改成功')
        } else {
          // 新增
          await addCourse(form)
          ElMessage.success('新增成功')
        }
        dialog.visible = false
        fetchData() // 刷新列表
      } catch (error) {
        console.error(error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 6. 删除课程
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认要删除课程 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteCourse(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

// 7. 重置表单
const resetForm = () => {
  form.id = undefined
  form.name = ''
  form.college = ''
  form.description = ''
  // 清除校验结果
  if (courseFormRef.value) {
    courseFormRef.value.resetFields()
  }
}

// 8. 简单的时间格式化（或者引入 dayjs）
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ')
}
</script>

<template>
  <div class="app-container" style="padding: 20px;">
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="课程名称">
          <el-input 
            v-model="queryParams.name" 
            placeholder="请输入课程名称" 
            clearable 
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" icon="Plus" @click="handleCreate">新增课程</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table 
      v-loading="loading" 
      :data="courseList" 
      border 
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="课程名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="college" label="开课学院" width="180" />
      <el-table-column prop="description" label="课程描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="180" align="center">
        <template #default="scope">
          {{ formatTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <el-dialog 
      :title="dialog.title" 
      v-model="dialog.visible" 
      width="500px" 
      @close="resetForm"
    >
      <el-form 
        ref="courseFormRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名称" />
        </el-form-item>
        
        <el-form-item label="开课学院" prop="college">
          <el-input v-model="form.college" placeholder="请输入开课学院" />
        </el-form-item>

        <el-form-item label="课程描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入课程简介" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>



<style scoped>
.filter-container {
  margin-bottom: 10px;
}
</style>