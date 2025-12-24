<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
// 引入上面定义的API
import { 
  getClazzList, 
  addClazz, 
  updateClazz, 
  deleteClazz, 
  getAllCourses, 
  getAllTeachers 
} from '@/api/clazz'
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const submitLoading = ref(false)

// 下拉框数据源
const courseOptions = ref([])
const teacherOptions = ref([])

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  courseName: '',
  teacherName: ''
})

// 弹窗控制
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单对象
const form = reactive({
  id: undefined,
  courseId: undefined,
  teacherId: undefined,
  className: ''
})

// 表单校验规则
const rules = {
  courseId: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
  teacherId: [{ required: true, message: '请选择授课教师', trigger: 'change' }],
  className: [{ required: true, message: '请输入班级名称', trigger: 'blur' }]
}

const formRef = ref(null)

// --- 生命周期 ---
onMounted(() => {
  fetchData()
  // 预加载下拉框数据，避免每次弹窗都请求
  loadOptions()
})

// --- 方法 ---

// 1. 获取数据列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getClazzList(queryParams)
    if (res.code === 1) {
      tableData.value = res.data.rows
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

// 加载下拉选项
const loadOptions = async () => {
  try {
    const [courseRes, teacherRes] = await Promise.all([getAllCourses(), getAllTeachers()])
    if (courseRes.code === 1) courseOptions.value = courseRes.data.rows
    if (teacherRes.code === 1) teacherOptions.value = teacherRes.data.rows
  } catch (error) {
    console.error('加载选项失败', error)
  }
}

// 2. 搜索
const handleQuery = () => {
  queryParams.page = 1
  fetchData()
}

// 重置搜索
const resetQuery = () => {
  queryParams.courseName = ''
  queryParams.teacherName = ''
  queryParams.page = 1
  fetchData()
}

// 3. 打开新增弹窗
const handleCreate = () => {
  resetForm()
  dialog.title = '新增班级'
  dialog.visible = true
}

// 4. 打开编辑弹窗
const handleEdit = (row) => {
  resetForm()
  dialog.title = '编辑班级'
  dialog.visible = true
  // 数据回显
  nextTick(() => {
    Object.assign(form, row)
  })
}

// 5. 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (form.id) {
          // 修改
          const res = await updateClazz(form)
          if (res.code === 1) {
            ElMessage.success('修改成功')
            dialog.visible = false
            fetchData()
          } else {
            ElMessage.error(res.msg) // 显示后端唯一性校验错误
          }
        } else {
          // 新增
          const res = await addClazz(form)
          if (res.code === 1) {
            ElMessage.success('新增成功')
            dialog.visible = false
            fetchData()
          } else {
            ElMessage.error(res.msg) // 显示后端唯一性校验错误
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 6. 删除班级
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认要删除班级 "${row.className}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteClazz(row.id)
      if (res.code === 1) {
        ElMessage.success('删除成功')
        fetchData()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (error) {
      console.error(error)
    }
  })
}

// 7. 重置表单
const resetForm = () => {
  form.id = undefined
  form.courseId = undefined
  form.teacherId = undefined
  form.className = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 8. 时间格式化
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
            v-model="queryParams.courseName" 
            placeholder="请输入课程名称" 
            clearable 
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="教师姓名">
          <el-input 
            v-model="queryParams.teacherName" 
            placeholder="请输入教师姓名" 
            clearable 
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" icon="Plus" @click="handleCreate">新增班级</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table 
      v-loading="loading" 
      :data="tableData" 
      border 
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      
      <el-table-column prop="courseName" label="课程名称" min-width="150" align="center">
        <template #default="scope">
          <el-tag effect="plain">{{ scope.row.courseName }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="className" label="班级名称" min-width="150" align="center" />

      <el-table-column prop="teacherName" label="授课教师" min-width="120" align="center">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.teacherName">{{ scope.row.teacherName }}</el-tag>
          <span v-else style="color: #999">未分配</span>
        </template>
      </el-table-column>

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
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="所属课程" prop="courseId">
          <el-select 
            v-model="form.courseId" 
            placeholder="请选择课程" 
            filterable 
            style="width: 100%"
          >
            <el-option
              v-for="item in courseOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="授课教师" prop="teacherId">
          <el-select 
            v-model="form.teacherId" 
            placeholder="请选择教师" 
            filterable 
            style="width: 100%"
          >
            <el-option
              v-for="item in teacherOptions"
              :key="item.id"
              :label="item.name + ' (' + item.username + ')'"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="班级名称" prop="className">
          <el-input v-model="form.className" placeholder="例如：2023计科1班" />
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