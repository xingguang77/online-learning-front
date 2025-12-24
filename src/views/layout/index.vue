<script setup>
import { ref, reactive, onMounted ,watch} from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, SwitchButton, Plus } from '@element-plus/icons-vue'
import { getUserById, updateProfile, changePassword } from '@/api/user'
import axios from 'axios'

const router = useRouter()
const loginName = ref('')
const userType = ref(null)
const dialogVisible = ref(false)
const activeTab = ref('profile')

const id = ref(null)
const profileForm = reactive({ name:'', email:'', image:'' })
const passwordForm = reactive({ oldPassword:'', newPassword:'', confirmPassword:'' })

// 初始化用户信息
onMounted(() => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'))
  if (loginUser) {
    loginName.value = loginUser.name
    userType.value = loginUser.userType
    id.value = loginUser.id
  }
})

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确认退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('退出登录成功')
    localStorage.removeItem('loginUser')
    router.push('/login')
  })
}

// 弹窗关闭前确认
const handleClose = (done) => {
  ElMessageBox.confirm('确认关闭个人中心吗？未保存的修改将丢失')
    .then(() => done())
    .catch(() => {})
}

// 2. 加载用户信息 (增加路径补偿)
const loadUser = async () => {
  if (!id.value) return
  const res = await getUserById(id.value)
  if (res.code === 1) {
    // 关键：如果后端返回的是相对路径，必须在这里拼接完整，否则 img 标签找不到文件
    const userData = res.data
    
    Object.assign(profileForm, userData)
  }
}

const saveProfile = async () => {
  console.log({ id: id.value, ...profileForm })
  const res = await updateProfile({ id: id.value, ...profileForm })
  if (res.code === 1) {
    ElMessage.success('资料更新成功')
    
    // 同步更新本地存储和当前显示的 loginName
    const user = JSON.parse(localStorage.getItem('loginUser'))
    user.name = profileForm.name
    localStorage.setItem('loginUser', JSON.stringify(user))
    loginName.value = profileForm.name 
  } else {
    ElMessage.error(res.msg)
  }
}

// 修改密码
const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('新密码与确认密码不一致')
    return
  }
  const res = await changePassword({ id:id.value, oldPassword:passwordForm.oldPassword, newPassword:passwordForm.newPassword })
  if (res.code === 1) {
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = passwordForm.newPassword = passwordForm.confirmPassword = ''
  } else ElMessage.error(res.msg)
}

// 上传头像
const beforeUpload = (file) => {
  if (!['image/jpeg','image/png'].includes(file.type)) { ElMessage.error('只支持 JPG / PNG 图片'); return false }
  if (file.size/1024/1024 > 2) { ElMessage.error('头像不能超过 2MB'); return false }
  return true
}

const handleAvatarSuccess = (response) => {
  profileForm.image=response.data
}
// 打开弹窗时加载数据
watch(dialogVisible, val => { 
  if(val) loadUser() 
  
  })
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- 顶部 -->
      <el-header class="header">
        <span class="title">大学生线上学习资源共享与问答系统</span>
        <span class="right_tool">
          <a href="javascript:void(0)" @click="dialogVisible = true">
            <el-icon><EditPen /></el-icon> 个人中心
            &nbsp;&nbsp;&nbsp; |  &nbsp;&nbsp;&nbsp;
          </a>
          <a href="javascript:void(0)" @click="logout">
            <el-icon><SwitchButton /></el-icon> 退出登录 【{{loginName}}】
          </a>
        </span>
      </el-header>

      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="220px" class="aside">
          <el-menu router>
            <template v-if="userType === 1">
              <el-menu-item index="/admin/course">
                <el-icon><Reading /></el-icon>
                <span>课程管理</span>
              </el-menu-item>
              
              <el-menu-item index="/admin/teacher">
                <el-icon><User /></el-icon>
                <span>教师管理</span>
              </el-menu-item>
              
              <el-menu-item index="/admin/class">
                <el-icon><DataBoard /></el-icon>
                <span>班级管理</span>
              </el-menu-item>
            </template>
            <template v-if="userType === 2">
              <el-menu-item index="/teacher">教师首页</el-menu-item>
              <el-menu-item index="/teacher/question">学生提问</el-menu-item>
              <el-menu-item index="/teacher/resource">资源管理</el-menu-item>
            </template>
            <template v-if="userType === 3">
              <el-menu-item index="/student">学生首页</el-menu-item>
              <el-menu-item index="/student/question">我要提问</el-menu-item>
              <el-menu-item index="/student/resource">学习资源</el-menu-item>
            </template>
          </el-menu>
        </el-aside>

        <!-- 主内容 -->
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>

    <!-- 个人中心弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="个人中心"
      width="700px"
      :before-close="handleClose"
    >
      <el-tabs v-model="activeTab" class="user-tabs">
        <!-- 基本资料 -->
        <el-tab-pane label="基本资料" name="profile">
          <div class="tab-content">
            <div class="avatar-wrapper">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :before-upload="beforeUpload"
                :on-success="handleAvatarSuccess"
              >
                <img v-if="profileForm.image" :src="profileForm.image" class="avatar"/>
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <span class="upload-tip">点击修改头像</span>
            </div>

            <el-form :model="profileForm" label-width="80px" class="custom-form">
              <el-form-item label="姓名">
                <el-input v-model="profileForm.name"/>
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email"/>
              </el-form-item>
              <div class="btn-container">
                <el-button type="primary" @click="saveProfile">保存资料</el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 密码管理 -->
        <el-tab-pane label="密码管理" name="password">
          <div class="tab-content">
            <el-form :model="passwordForm" label-width="80px" class="custom-form">
              <el-form-item label="原密码">
                <el-input type="password" v-model="passwordForm.oldPassword" show-password/>
              </el-form-item>
              <el-form-item label="新密码">
                <el-input type="password" v-model="passwordForm.newPassword" show-password/>
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input type="password" v-model="passwordForm.confirmPassword" show-password/>
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
  </div>
</template>


<style scoped>
.header { background: linear-gradient(to right,#00547d,#007fa4,#00aaa0,#00d072,#a8eb12); }
.title { color:white;font-size:40px;font-family:楷体;line-height:60px;font-weight:bolder; }
.right_tool{ float:right; line-height:60px; } 
a{ color:white; text-decoration:none; }
.aside{ width:220px; border-right:1px solid #ccc; min-height:100vh; }
.el-main{ padding:20px; }
.common-layout,.el-container{ height:100%; }

/* 弹窗样式 */
.user-tabs{ margin-top:-10px; }
.tab-content{ padding:30px 0; display:flex; flex-direction:column; align-items:center; }
.avatar-wrapper{ display:flex; flex-direction:column; align-items:center; margin-bottom:25px; }
.avatar-uploader :deep(.el-upload){ border:1px dashed #dcdfe6; border-radius:4px; cursor:pointer; width:100px;height:100px; display:flex; justify-content:center; align-items:center; background:#f5f7fa; }
.avatar{ width:100%; height:100%; object-fit:contain; display:block; }
.upload-tip{ font-size:12px; color:#909399; margin-top:8px; }
.custom-form{ width:350px; }
.btn-container{ display:flex; justify-content:center; margin-top:20px; }
.btn-container .el-button{ padding:0 40px; }
</style>
