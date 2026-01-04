import request from '@/utils/request'

export default {
  // 获取我的班级列表
  getMyClasses() {
    return request({
      url: '/student/resource/classes',
      method: 'get'
    })
  },
  // 获取单个班级详情 (需后端补充接口，或直接从列表页传递数据)
  getClassDetail(id) {
    return request({
      url: `/student/resource/class/${id}`,
      method: 'get'
    })
  },
  // 获取通知未读数
  getUnreadCount() {
    return request({
      url: '/student/notification/unread',
      method: 'get'
    })
  }
}