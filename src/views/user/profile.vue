<!-- <script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserById, updateProfile, changePassword } from '@/api/user'
import { Plus } from '@element-plus/icons-vue' // 确保导入图标

const dialogVisible = ref(false)
const activeTab = ref('profile') // 控制当前显示的标签页


const id = ref(null)

const profileForm = reactive({
  name: '',
  email: '',
  image: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loadUser = async () => {
  const res = await getUserById(id.value)
  if (res.code === 1) {
    Object.assign(profileForm, res.data)
  } else {
    ElMessage.error(res.msg)
  }
}

onMounted(() => {
  dialogVisible.value = true // 每次进入组件强制设为可见
  const loginUser = JSON.parse(localStorage.getItem('loginUser'))
  if (loginUser) {
    id.value = loginUser.id
    loadUser()
  }
  
})

const handleClose = (done) => {
  console.log(dialogVisible.value)
  ElMessageBox.confirm('确认关闭个人中心吗？未保存的修改将丢失')
    .then(() => {
      done()
    })
    .catch(() => {
    })
}

const saveProfile = async () => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'))
  const res = await updateProfile({
    id: loginUser.id,
    name: profileForm.name,
    email: profileForm.email,
    image: profileForm.image
  })
  if (res.code === 1) {
    ElMessage.success('资料更新成功')
  } else {
    ElMessage.error(res.msg)
  }
}

const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('新密码与确认密码不一致')
    return
  }
  const loginUser = JSON.parse(localStorage.getItem('loginUser'))
  const res = await changePassword({
    id: loginUser.id,
    oldPassword: passwordForm.oldPassword,
    newPassword: passwordForm.newPassword
  })
  if (res.code === 1) {
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    ElMessage.error(res.msg)
  }
}

const beforeUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持 JPG / PNG 图片')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarChange = (file) => {
  profileForm.image = URL.createObjectURL(file.raw)
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="个人中心"
    width="700px"
    :before-close="handleClose"
  >
    <el-tabs v-model="activeTab" class="user-tabs">
      
      <el-tab-pane label="基本资料" name="profile">
        <div class="tab-content">
          <div class="avatar-wrapper">
            <el-upload
              class="avatar-uploader"
              action=""
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-change="handleAvatarChange"
              :auto-upload="false"
            >
              <img v-if="profileForm.image" :src="profileForm.image" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <span class="upload-tip">点击修改头像</span>
          </div>

          <el-form :model="profileForm" label-width="80px" label-position="left" class="custom-form">
            <el-form-item label="姓名">
              <el-input v-model="profileForm.name" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <div class="btn-container">
              <el-button type="primary" @click="saveProfile">保存资料</el-button>
            </div>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="密码管理" name="password">
        <div class="tab-content">
          <el-form :model="passwordForm" label-width="80px" label-position="left" class="custom-form">
            <el-form-item label="原密码">
              <el-input type="password" v-model="passwordForm.oldPassword" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input type="password" v-model="passwordForm.newPassword" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input type="password" v-model="passwordForm.confirmPassword" show-password />
            </el-form-item>
            <div class="btn-container">
              <el-button type="primary" @click="savePassword">修改密码</el-button>
            </div>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 调整 Tabs 样式 */
.user-tabs {
  margin-top: -10px;
}

.tab-content {
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 头像居中且不设圆角 */
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #dcdfe6;
  border-radius: 4px; /* 矩形 */
  cursor: pointer;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保证原图比例完整展示，不被裁剪 */
  display: block;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 控制表单宽度 */
.custom-form {
  width: 350px; /* 输入框更短更精致 */
}

/* 按钮居中容器 */
.btn-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.btn-container .el-button {
  padding: 0 40px;
}
</style> -->