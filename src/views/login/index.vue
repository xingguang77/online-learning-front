<script setup>
  import { ref, reactive } from 'vue'
  // 注意：这里需要确保 api/login.js 中导出了 register 方法
  import { login, register } from '@/api/login'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  
  // 模式切换控制：true=登录，false=注册
  const isLogin = ref(true)

  // 登录表单
  let loginForm = ref({username:'', password:''})
  
  // 注册表单
  const registerForm = reactive({
    username: '',
    name: '', // 注册需要填写真实姓名
    password: '',
    confirmPassword: ''
  })

  // 登录提交
  const handleLogin = async () => {
    if(!loginForm.value.username || !loginForm.value.password) {
      return ElMessage.warning('请输入用户名和密码')
    }

    const res = await login(loginForm.value)
    if(res.code==1){
      ElMessage.success('登录成功')
      // 1. 先清空旧的登录信息
      localStorage.clear()
      // 2. 存储新的登录信息
      // 保存 token (假设后端返回数据里有 token)
      if(res.data.token) localStorage.setItem('token', res.data.token)
      localStorage.setItem('loginUser', JSON.stringify(res.data))
      
      const {userType} = res.data
      if (userType === 1) {
        router.push('/admin')
      } else if (userType === 2) {
        router.push('/teacher')
      } else if (userType === 3) {
        router.push('/student')
      }
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 注册提交
  const handleRegister = async () => {
    // 简单的校验
    if (!registerForm.username || !registerForm.password || !registerForm.name) {
      return ElMessage.warning('请补全注册信息')
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      return ElMessage.warning('两次输入的密码不一致')
    }

    // 调用后端注册接口
    const res = await register(registerForm)
    if (res.code === 1) {
      ElMessage.success('注册成功，请登录')
      // 自动填入账号，并切换回登录页
      loginForm.value.username = registerForm.username
      loginForm.value.password = ''
      isLogin.value = true // 切换回登录
    } else {
      ElMessage.error(res.msg || '注册失败')
    }
  }

  // 重置/清空
  const clear = () => {
    if (isLogin.value) {
      loginForm.value = { username: '', password: '' }
    } else {
      Object.assign(registerForm, { username: '', name: '', password: '', confirmPassword: '' })
    }
  }

  // 切换模式
  const toggleMode = () => {
    isLogin.value = !isLogin.value
    clear() // 切换时清空表单
  }
</script>

<template>
  <div id="container">
    <div class="login-form">
      <el-form label-width="80px">
        <p class="title">大学生线上学习资源共享与问答系统</p>
        
        <h3 style="text-align: center; margin-bottom: 20px; color: #666;">
          {{ isLogin ? '用户登录' : '学生账号注册' }}
        </h3>

        <div v-if="isLogin">
          <el-form-item label="用户名" class="center-item">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" style="width: 300px" @keyup.enter="handleLogin"></el-input>
          </el-form-item>

          <el-form-item label="密码" class="center-item"> 
            <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" style="width: 300px" @keyup.enter="handleLogin"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button class="button" type="primary" @click="handleLogin">登 录</el-button>
            <el-button class="button" type="info" @click="clear">重 置</el-button>
          </el-form-item>
        </div>

        <div v-else>
          <el-form-item label="账号" class="center-item">
            <el-input v-model="registerForm.username" placeholder="设置登录账号(学号)" style="width: 300px"></el-input>
          </el-form-item>

          <el-form-item label="姓名" class="center-item">
            <el-input v-model="registerForm.name" placeholder="请输入真实姓名" style="width: 300px"></el-input>
          </el-form-item>

          <el-form-item label="密码" class="center-item"> 
            <el-input type="password" v-model="registerForm.password" placeholder="设置登录密码" style="width: 300px"></el-input>
          </el-form-item>

          <el-form-item label="确认密码" class="center-item"> 
            <el-input type="password" v-model="registerForm.confirmPassword" placeholder="再次输入密码" style="width: 300px"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button class="button" type="success" @click="handleRegister">注 册</el-button>
            <el-button class="button" @click="toggleMode">返 回</el-button>
          </el-form-item>
        </div>

        <div class="form-footer">
          <span v-if="isLogin">
            还没有账号？ <el-link type="primary" @click="toggleMode">去注册 (仅限学生)</el-link>
          </span>
          <span v-else>
            已有账号？ <el-link type="primary" @click="toggleMode">去登录</el-link>
          </span>
        </div>

      </el-form>
    </div>
  </div>
</template>

<style scoped>
#container {
  /* 核心修改：移除 padding，使用 flex 绝对居中 */
  height: 100vh;
  width: 100vw;
  background-image: url('../../assets/bg1.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
  
  /* 防止出现滚动条 */
  overflow: hidden;
}

.login-form {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  /* 移除 margin，因为父容器 flex 已经居中了 */
  /* margin: 0 auto; */ 
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background-color: rgba(255, 255, 255, 0.95);
}

.title {
  font-size: 30px;
  font-family: '楷体';
  text-align: center;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
}

.button {
  margin-top: 10px;
  width: 120px;
}

.center-item {
  display: flex;
  justify-content: center;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}
</style>