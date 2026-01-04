import request from '@/utils/request'

export default {
  // 1. 获取问题列表
  getList(params) {
    return request({
      url: '/admin/qa/list',
      method: 'get',
      params
    })
  },

  // 2. 获取问题详情（含回答列表）
  getQuestionDetail(id) {
    return request({
      url: `/admin/qa/question/${id}`,
      method: 'get'
    })
  },

  // 3. 修改问题 (标题、内容、附件)
  updateQuestion(data) {
    return request({
      url: '/admin/qa/question',
      method: 'put',
      data
    })
  },

  // 4. 删除问题
  deleteQuestion(id) {
    return request({
      url: `/admin/qa/question/${id}`,
      method: 'delete'
    })
  },

  // 5. 获取单个回答详情 (用于回显)
  getAnswer(id) {
    return request({
      url: `/admin/qa/answer/${id}`,
      method: 'get'
    })
  },

  // 6. 修改回答
  updateAnswer(data) {
    return request({
      url: '/admin/qa/answer',
      method: 'put',
      data
    })
  },

  // 7. 删除回答
  deleteAnswer(id) {
    return request({
      url: `/admin/qa/answer/${id}`,
      method: 'delete'
    })
  }
}