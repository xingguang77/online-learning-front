import request from '@/utils/request'

export default {
  // 1. 获取我的班级列表 (用于筛选和上传)
  getMyClasses() {
    return request({
      url: '/student/resource/classes',
      method: 'get'
    })
  },

  // 2. 获取资源列表
  getList(params) {
    return request({
      url: '/student/resource/list',
      method: 'get',
      params
    })
  },

  // 3. 上传资源
  upload(data) {
    return request({
      url: '/student/resource/upload',
      method: 'post',
      data
    })
  },

  // 4. 获取详情
  getDetail(id) {
    return request({
      url: `/student/resource/${id}`,
      method: 'get'
    })
  },

  // 5. 记录下载
  recordDownload(id) {
    return request({
      url: `/student/resource/${id}/download`,
      method: 'put'
    })
  },

  // [新增] 获取我上传的资源
  getMyResources(params) {
    return request({
      url: '/student/resource/my',
      method: 'get',
      params
    })
  },

  // [新增] 修改资源
  updateResource(data) {
    return request({
      url: '/student/resource/update',
      method: 'put',
      data
    })
  },

  // [新增] 删除资源
  deleteResource(id) {
    return request({
      url: `/student/resource/${id}`,
      method: 'delete'
    })
  }
}