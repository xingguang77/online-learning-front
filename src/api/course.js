import request from '@/utils/request'

// 分页查询课程列表
export function getCourseList(params) {
  return request({
    url: '/admin/course/list',
    method: 'get',
    params // 包含 page, pageSize, name
  })
}

// 新增课程
export function addCourse(data) {
  return request({
    url: '/admin/course',
    method: 'post',
    data // 包含 name, description, college
  })
}

// 修改课程
export function updateCourse(data) {
  return request({
    url: '/admin/course',
    method: 'put',
    data // 包含 id, name, description, college
  })
}

// 删除课程
export function deleteCourse(id) {
  return request({
    url: `/admin/course/${id}`,
    method: 'delete'
  })
}