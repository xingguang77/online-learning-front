import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

// [新增] 注册接口
export function register(data) {
  return request({
    url: '/register',
    method: 'post',
    data
  })
}