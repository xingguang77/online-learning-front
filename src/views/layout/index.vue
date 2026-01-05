<script setup>
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request' // 引入 request 用于直接调用通知接口
// 引入图标
import { 
  EditPen, SwitchButton, Plus, Management, Comment, UploadFilled, Files, ChatDotSquare,
  Reading, User, DataBoard, Notebook, Collection, ChatLineRound, HomeFilled, Bell, Message
} from '@element-plus/icons-vue'
import { getUserById, updateProfile, changePassword } from '@/api/user'

const router = useRouter()
const loginName = ref('')
const userType = ref(null)
const dialogVisible = ref(false)
const activeTab = ref('profile')

const id = ref(null)
const profileForm = reactive({ name: '', email: '', image: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

// === 通知相关变量 ===
const unreadCount = ref(0)
const notifVisible = ref(false)
const notifList = ref([])
const timer = ref(null)

// 初始化用户信息
onMounted(async () => { // 1. 改为 async
  const loginUser = JSON.parse(localStorage.getItem('loginUser'))
  if (loginUser) {
    loginName.value = loginUser.name
    userType.value = loginUser.userType
    id.value = loginUser.id
    
    // 如果是学生，开启通知检测
    if (userType.value === 3) {
      // 2. 先等待获取未读数
      await fetchUnreadCount()
      
      // 3. 【核心新增】如果存在未读消息，弹出橙色居中提示框
      if (unreadCount.value > 0) {
        ElMessageBox.confirm(
          `您有 ${unreadCount.value} 条未读消息，建议立即查看。`,
          '新消息通知',
          {
            confirmButtonText: '立即查看',
            cancelButtonText: '稍后再说',
            type: 'warning',    // 橙色图标
            center: true,       // 居中布局
            draggable: true,    // 可拖拽
            closeOnClickModal: false
          }
        ).then(() => {
          // 4. 点击“立即查看”，直接打开消息中心弹窗
          openNotifications()
        }).catch(() => {
          // 点击取消，不做操作
        })
      }

      // 开启轮询（每30秒更新一次数字，但不重复弹窗）
      timer.value = setInterval(fetchUnreadCount, 30000)
    }
  }
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

// === 通知 API 逻辑 ===
const fetchUnreadCount = async () => {
  try {
    const res = await request.get('/student/notification/unread')
    if (res.code === 1) {
      unreadCount.value = res.data
    }
  } catch (e) {
    console.error('获取通知失败', e)
  }
}

// 打开消息中心弹窗
const openNotifications = async () => {
  notifVisible.value = true
  // 获取列表
  const res = await request.get('/student/notification/list')
  if (res.code === 1) {
    notifList.value = res.data
  }
}

const handleMarkRead = async () => {
  if (unreadCount.value === 0) return
  await request.put('/student/notification/read')
  unreadCount.value = 0
  // 将列表中的状态也置为已读
  notifList.value.forEach(n => n.isRead = 1)
  ElMessage.success('全部已读')
}

// === 用户原有逻辑 ===
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

const handleClose = (done) => {
  ElMessageBox.confirm('确认关闭个人中心吗？未保存的修改将丢失')
    .then(() => done())
    .catch(() => {})
}

const loadUser = async () => {
  if (!id.value) return
  const res = await getUserById(id.value)
  if (res.code === 1) {
    const userData = res.data
    Object.assign(profileForm, userData)
  }
}

const saveProfile = async () => {
  const res = await updateProfile({ id: id.value, ...profileForm })
  if (res.code === 1) {
    ElMessage.success('资料更新成功')
    const user = JSON.parse(localStorage.getItem('loginUser'))
    user.name = profileForm.name
    localStorage.setItem('loginUser', JSON.stringify(user))
    loginName.value = profileForm.name
  } else {
    ElMessage.error(res.msg)
  }
}

const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('新密码与确认密码不一致')
    return
  }
  const res = await changePassword({ 
    id: id.value, 
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

const beforeUpload = (file) => {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.error('只支持 JPG / PNG 图片')
    return false
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.error('头像不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarSuccess = (response) => {
  if (response.code === 1) {
    profileForm.image = response.data
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}


// 处理查看点击
const handleViewDetail = (item) => {
  // 如果有关联ID，跳转到问答广场并带上ID参数
  if (item.relatedId) {
    notifVisible.value = false // 关闭通知弹窗
    router.push({ 
      path: '/student/question', 
      query: { id: item.relatedId } // 传递参数
    })
  } else {
    // 如果没有ID，只是普通通知，就留在这里
    ElMessage.info('该通知无详情链接')
  }
}

watch(dialogVisible, (val) => {
  if (val) loadUser()
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="title">大学生线上学习资源共享与问答系统</span>
        </div>

        <div class="header-center" v-if="userType === 3">
          <div class="notification-box" @click="openNotifications">
            <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="notif-badge">
              <el-icon class="bell-icon"><Bell /></el-icon>
            </el-badge>
            <span class="notif-text">消息通知</span>
          </div>
        </div>

        <div class="header-right">
          <a href="javascript:void(0)" @click="dialogVisible = true">
            <el-icon><EditPen /></el-icon> 个人中心
          </a>
          <span class="divider">|</span>
          <a href="javascript:void(0)" @click="logout">
            <el-icon><SwitchButton /></el-icon> 退出登录 【{{ loginName }}】
          </a>
        </div>
      </el-header>

      <el-container>
        <el-aside width="220px" class="aside">
          <el-menu router :default-active="$route.path">
            
            <template v-if="userType === 1">
              <el-menu-item index="/admin">
                <el-icon><Reading /></el-icon> <span>课程管理</span>
              </el-menu-item>
              <el-menu-item index="/admin/teacher">
                <el-icon><User /></el-icon> <span>教师管理</span>
              </el-menu-item>
              <el-menu-item index="/admin/class">
                <el-icon><DataBoard /></el-icon> <span>班级管理</span>
              </el-menu-item>
              <el-menu-item index="/admin/resource">
                <el-icon><Files /></el-icon> <span>资源审核</span>
              </el-menu-item>
              <el-menu-item index="/admin/qa">
                <el-icon><ChatDotSquare /></el-icon> <span>问答管理</span>
              </el-menu-item>
            </template>

            <template v-if="userType === 2">
              <el-menu-item index="/teacher">
                <el-icon><Management /></el-icon> <span>教师工作台</span>
              </el-menu-item>
              <el-menu-item index="/teacher/qa">
                <el-icon><Comment /></el-icon> <span>答疑中心</span>
              </el-menu-item>
              <el-menu-item index="/teacher/publish">
                <el-icon><UploadFilled /></el-icon> <span>资源发布</span>
              </el-menu-item>
            </template>

            <template v-if="userType === 3">
              <el-menu-item index="/student">
                <el-icon><HomeFilled /></el-icon> <span>学生首页</span>
              </el-menu-item>
              <el-menu-item index="/student/question">
                <el-icon><ChatLineRound /></el-icon> <span>问答广场</span>
              </el-menu-item>
              <el-menu-item index="/student/resource">
                <el-icon><Collection /></el-icon> <span>资源中心</span>
              </el-menu-item>
              <el-menu-item index="/student/center">
                <el-icon><User /></el-icon> <span>个人中心</span>
              </el-menu-item>
            </template>

          </el-menu>
        </el-aside>

        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="dialogVisible" title="个人中心" width="700px" :before-close="handleClose">
      <el-tabs v-model="activeTab" class="user-tabs">
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
              <el-form-item label="姓名"><el-input v-model="profileForm.name"/></el-form-item>
              <el-form-item label="邮箱"><el-input v-model="profileForm.email"/></el-form-item>
              <div class="btn-container">
                <el-button type="primary" @click="saveProfile">保存资料</el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="密码管理" name="password">
          <div class="tab-content">
            <el-form :model="passwordForm" label-width="80px" class="custom-form">
              <el-form-item label="原密码"><el-input type="password" v-model="passwordForm.oldPassword" show-password/></el-form-item>
              <el-form-item label="新密码"><el-input type="password" v-model="passwordForm.newPassword" show-password/></el-form-item>
              <el-form-item label="确认密码"><el-input type="password" v-model="passwordForm.confirmPassword" show-password/></el-form-item>
              <div class="btn-container">
                <el-button type="primary" @click="savePassword">修改密码</el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer><el-button @click="dialogVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="notifVisible" title="消息中心" width="600px" center custom-class="notif-dialog">
      <div class="notif-header">
        <span>共 {{ notifList.length }} 条通知</span>
        <el-button type="primary" link @click="handleMarkRead" :disabled="unreadCount === 0">一键已读</el-button>
      </div>
      
      <el-scrollbar max-height="400px">
        <div v-if="notifList.length > 0" class="notif-list">
          <div v-for="item in notifList" :key="item.id" class="notif-item" :class="{ unread: item.isRead === 0 }">
            <div class="notif-icon">
              <el-icon><Message /></el-icon>
            </div>
            <div class="notif-content">
              <div class="notif-msg">{{ item.content }}</div>
              <div class="notif-time">{{ item.createTime }}</div>
            </div>
            <div class="notif-action">
              <el-button 
                v-if="item.relatedId" 
                type="primary" 
                link 
                size="small" 
                @click="handleViewDetail(item)"
              >
                查看
              </el-button>
            </div>
            <div class="notif-status">
              <el-badge is-dot v-if="item.isRead === 0" />
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无消息" :image-size="80"></el-empty>
      </el-scrollbar>
    </el-dialog>

  </div>
</template>

<style scoped>
.header {
  background: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative; /* 为绝对定位的中间元素提供参照 */
}

.header-left .title {
  font-size: 30px; /* 原有大小，可调小适应布局 */
  font-family: 楷体;
  font-weight: bolder;
  line-height: 60px;
}

/* === 修改核心：居中且放大的通知区域 === */
.header-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.notification-box {
  display: flex;
  align-items: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 20px;
  border-radius: 30px;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.notification-box:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.bell-icon {
  font-size: 28px; /* 放大图标 */
  color: #fff;
}

.notif-text {
  font-size: 16px;
  margin-left: 10px;
  font-weight: bold;
}

/* 右侧工具栏 */
.header-right {
  display: flex;
  align-items: center;
}
.header-right a {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  font-size: 14px;
}
.header-right .divider {
  margin: 0 15px;
}

.aside { width: 220px; border-right: 1px solid #ccc; min-height: 100vh; background-color: #fff; }
.el-main { padding: 20px; background-color: #f0f2f5; }
.common-layout, .el-container { height: 100%; }

/* 个人中心弹窗样式保持不变 */
.user-tabs { margin-top: -10px; }
.tab-content { padding: 30px 0; display: flex; flex-direction: column; align-items: center; }
.avatar-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 25px; }
.avatar-uploader :deep(.el-upload) { border: 1px dashed #dcdfe6; border-radius: 4px; cursor: pointer; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; background: #f5f7fa; }
.avatar { width: 100%; height: 100%; object-fit: contain; display: block; }
.upload-tip { font-size: 12px; color: #909399; margin-top: 8px; }
.custom-form { width: 350px; }
.btn-container { display: flex; justify-content: center; margin-top: 20px; }
.btn-container .el-button { padding: 0 40px; }

/* === 通知列表样式 === */
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.notif-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.notif-item:hover { background-color: #f9f9f9; }
.notif-item.unread { background-color: #ecf5ff; }
.notif-icon {
  margin-right: 15px;
  color: #409EFF;
  font-size: 20px;
  margin-top: 2px;
}
.notif-content { flex: 1; }
.notif-msg { font-size: 14px; color: #333; line-height: 1.5; margin-bottom: 5px; }
.notif-time { font-size: 12px; color: #999; }
.notif-status { width: 20px; display: flex; justify-content: center; align-items: center; }
</style>