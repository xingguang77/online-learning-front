import request from '@/utils/request'

// 获取当前登录用户信息
export const getUserById = (id) => {
  return request.get(`/user/${id}`)
}


// 修改个人资料
export const updateProfile = (data) => request.put('/user/profile', data)

// 修改密码
export const changePassword = (data) => request.put('/user/password', data)
