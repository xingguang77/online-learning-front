<script setup>
  import { ref } from 'vue'
  import { loginApi } from '@/api/login'
  import {ElMessage} from 'element-plus'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  let loginForm = ref({username:'', password:''})
  const router = useRouter()
  //登录提交
  const login = async () => {
    const res = await loginApi(loginForm.value)
    if(res.code==1){
      ElMessage.success('登录成功')
      //登录成功后，将token存储到localStorage

      // 1. 先清空旧的登录信息，防止角色残留混乱
      localStorage.clear()

      //2. 存储新的登录信息
      console.log(res.data)
      const {userType} = res.data
      localStorage.setItem('loginUser', JSON.stringify(res.data))
      if (userType === 1) {
        router.push('/admin')
      } else if (userType === 2) {
        router.push('/teacher')
      } else if (userType === 3) {
        router.push('/student')
      }
    }else{
      ElMessage.error(res.msg)
    }
  }

  //取消登录
  const clear = () => {
    loginForm.value = {
      username: '',
      password: ''
    }
  }
</script>

<template>
  <div id="container">
    <div class="login-form">
      <el-form label-width="80px">
        <p class="title">大学生线上学习资源共享与问答系统</p>
        <el-form-item label="用户名" prop="username" class="center-item">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" style="width: 300px" ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password" class="center-item"> 
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" style="width: 300px"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button class="button" type="primary" @click="login">登 录</el-button>
          <el-button class="button" type="info" @click="clear">重 置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
#container {
  padding: 10%;
  height: 410px;
  background-image: url('../../assets/bg1.jpg');
  background-repeat: no-repeat;
  background-size: cover;
}

.login-form {
  max-width: 480px;
  padding: 40px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background-color: white;
}

.title {
  font-size: 30px;
  font-family: '楷体';
  text-align: center;
  margin-bottom: 30px;
  font-weight: bold;
}

.button {
  margin-top: 30px;
  width: 120px;
}
.center-item {
  display: flex;
  justify-content: center; /* 输入框居中 */
}
</style>