<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getTeacherList, addTeacher, updateTeacher, deleteTeacher } from '@/api/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
// --- 数据定义 ---
const loading = ref(false)
const teacherList = ref([])
const total = ref(0)
const submitLoading = ref(false)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: ''
})

const dialog = reactive({
  visible: false,
  title: ''
})

const form = reactive({
  id: undefined,      // teacher 表主键
  userId: undefined,  // user 表主键
  username: '',
  password: '',
  name: '',
  title: '',
  introduction: ''
})

const formRef = ref(null)

// 校验规则
const rules = {
  username: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  title: [{ required: true, message: '请选择职称', trigger: 'change' }]
}

// --- 初始化 ---
onMounted(() => {
  fetchData()
})

// --- 方法 ---

// 查询数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getTeacherList(queryParams)
    if (res.code === 1) {
      teacherList.value = res.data.rows // 注意：Result.data 是 PageResult，里面是 rows
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 新增：重置搜索条件
const resetQuery = () => {
  queryParams.name = ''   // 清空课程名称输入框
  queryParams.page = 1    // 重置到第一页
  fetchData()             // 刷新列表数据
}
// 搜索
const handleQuery = () => {
  queryParams.page = 1
  fetchData()
}

// 打开新增
const handleCreate = () => {
  resetForm()
  dialog.title = '新增教师'
  dialog.visible = true
}

// 打开编辑
const handleEdit = (row) => {
  resetForm()
  dialog.title = '编辑教师'
  dialog.visible = true
  
  // 填充表单
  nextTick(() => {
    form.id = row.id
    form.userId = row.userId
    form.username = row.username
    form.name = row.name
    form.title = row.title
    form.introduction = row.introduction
    // 编辑时不需要填充密码
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (form.id) {
          const res = await updateTeacher(form)
          if (res.code === 1) {
            ElMessage.success('修改成功')
            dialog.visible = false
            fetchData() // 刷新列表
          } else {
            // 如果 code 不是 1，说明后端主动报了错（如：账号已存在）
            // 此时不应该关闭弹窗，也不应该提示成功
            ElMessage.error(res.msg || '操作失败')
            }
        } else {
          const res = await addTeacher(form)
          if (res.code === 1) {
            ElMessage.success('新增成功')
            dialog.visible = false
            fetchData() // 刷新列表
            } else {
                // 如果 code 不是 1，说明后端主动报了错（如：账号已存在）
                // 此时不应该关闭弹窗，也不应该提示成功
                ElMessage.error(res.msg || '操作失败')
            }
        }
      } catch (e) {
        console.error(e)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除教师 "${row.name}" 吗？此操作将同时删除其登录账号。`, 
    '警告', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteTeacher(row.id, row.userId)
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
      console.error(e)
    }
  })
}

// 重置表单
const resetForm = () => {
  form.id = undefined
  form.userId = undefined
  form.username = ''
  form.password = ''
  form.name = ''
  form.title = ''
  form.introduction = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 辅助函数：根据职称显示不同颜色的标签
const getTitleTagType = (title) => {
  switch (title) {
    case '教授': return 'danger'
    case '副教授': return 'warning'
    case '讲师': return 'success'
    default: return 'info'
  }
}
</script>

<template>
  <div class="app-container" style="padding: 20px;">
    <el-card shadow="never" class="filter-container" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="教师姓名">
          <el-input 
            v-model="queryParams.name" 
            placeholder="请输入姓名" 
            clearable 
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" icon="Plus" @click="handleCreate">新增教师</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table 
      v-loading="loading" 
      :data="teacherList" 
      border 
      stripe
      style="width: 100%"
    >
      <el-table-column prop="username" label="工号(账号)" width="150" align="center" />
      <el-table-column prop="name" label="姓名" width="120" align="center" />
      <el-table-column prop="title" label="职称" width="120" align="center">
        <template #default="scope">
          <el-tag :type="getTitleTagType(scope.row.title)">{{ scope.row.title }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="introduction" label="教师简介" show-overflow-tooltip />
      
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
        :page-sizes="[10, 20, 50]"
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
        label-width="80px"
      >
        <el-form-item label="工号" prop="username" v-if="!form.id">
          <el-input v-model="form.username" placeholder="请输入工号(用于登录)" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="默认123456" 
            show-password
          />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入教师姓名" />
        </el-form-item>

        <el-form-item label="职称" prop="title">
          <el-select v-model="form.title" placeholder="请选择职称" style="width: 100%">
            <el-option label="助教" value="助教" />
            <el-option label="讲师" value="讲师" />
            <el-option label="副教授" value="副教授" />
            <el-option label="教授" value="教授" />
          </el-select>
        </el-form-item>

        <el-form-item label="简介" prop="introduction">
          <el-input 
            v-model="form.introduction" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入教师简介" 
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