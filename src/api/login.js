import request from '@/utils/request'
//登录post
export const loginApi = (data) =>
    request.post('/login',data)