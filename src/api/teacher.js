import request from '@/utils/request'

// 获取教师列表
export function getTeacherList(params) {
  return request({
    url: '/admin/teacher/list',
    method: 'get',
    params
  })
}

// 新增教师
export function addTeacher(data) {
  return request({
    url: '/admin/teacher',
    method: 'post',
    data
  })
}

// 修改教师
export function updateTeacher(data) {
  return request({
    url: '/admin/teacher',
    method: 'put',
    data
  })
}

// 删除教师
export function deleteTeacher(id, userId) {
  return request({
    url: `/admin/teacher/${id}/${userId}`,
    method: 'delete'
  })
}