import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
//创建axios实例对象
const request = axios.create({
  baseURL: '/api',
  timeout: 600000
})

// axios的响应拦截器
request.interceptors.response.use(
  (response) => { 
    return response.data
  },
  (error) => { 
    // 检查是否有响应对象以及状态码是否为 401
    if (error.response && error.response.status === 401) {
      // ⭐ 核心步骤：清除本地缓存
      localStorage.removeItem('loginUser') 
      
      ElMessage.error('登录已过期，请重新登录')
      
      // 跳转到登录页面
      router.push('/login')
    } else {
      ElMessage.error('接口访问异常')
    }
    return Promise.reject(error)
  }
)

//axios的请求拦截器
request.interceptors.request.use(
  (config) => { //成功回调
    //从localStorage中获取登录用户信息
    const loginUser = JSON.parse(localStorage.getItem('loginUser'))
    if(loginUser&&loginUser.token){
      //将登录用户的token添加到请求头中
      config.headers.token = loginUser.token
    }
    return config
  },
  (error) => { //失败回调
    return Promise.reject(error)
  }
)

export default request