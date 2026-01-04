import request from '@/utils/request'

export default {
  // 1. [核心] 问题列表 (搜索/筛选)
  getList(params) {
    return request({
      url: '/student/qa/list',
      method: 'get',
      params
    })
  },

  // 2. [核心] 发布问题
  addQuestion(data) {
    return request({
      url: '/student/qa/add',
      method: 'post',
      data
    })
  },

  // 3. [核心] 获取问题详情 (包含回答)
  getDetail(id) {
    return request({
      url: `/student/qa/${id}`,
      method: 'get'
    })
  },

  // 4. [新增] 获取我提出的问题 (个人中心用)
  getMyQuestions(params) {
    return request({
      url: '/student/qa/my',
      method: 'get',
      params
    })
  },

  // 5. [新增] 修改问题
  updateQuestion(data) {
    return request({
      url: '/student/qa/update',
      method: 'put',
      data
    })
  },

  // 6. [新增] 删除问题
  deleteQuestion(id) {
    return request({
      url: `/student/qa/${id}`,
      method: 'delete'
    })
  }
}