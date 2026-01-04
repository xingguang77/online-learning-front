import request from '@/utils/request'

export default {
  // 1. 获取资源列表 (支持分页、关键词、状态筛选)
  getList(params) {
    return request({
      url: '/admin/resource/list',
      method: 'get',
      params
    })
  },

  // 2. 审核/更新状态 (status: 1-通过, 2-驳回)
  updateStatus(id, status) {
    return request({
      url: `/admin/resource/${id}/status/${status}`,
      method: 'put'
    })
  },

  // 3. 修改资源内容 (标题、描述)
  updateContent(data) {
    return request({
      url: '/admin/resource/update',
      method: 'put',
      data
    })
  },

  // 4. 删除资源
  deleteResource(id) {
    return request({
      url: `/admin/resource/${id}`,
      method: 'delete'
    })
  }
}