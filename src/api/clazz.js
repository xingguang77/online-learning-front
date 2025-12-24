import request from '@/utils/request'

// 分页查询班级列表 (支持搜索: courseName, teacherName)
export function getClazzList(params) {
  return request({
    url: '/admin/clazz/list',
    method: 'get',
    params
  })
}

// 新增班级
export function addClazz(data) {
  return request({
    url: '/admin/clazz',
    method: 'post',
    data // { courseId, teacherId, className }
  })
}

// 修改班级
export function updateClazz(data) {
  return request({
    url: '/admin/clazz',
    method: 'put',
    data // { id, courseId, teacherId, className }
  })
}

// 删除班级
export function deleteClazz(id) {
  return request({
    url: `/admin/clazz/${id}`,
    method: 'delete'
  })
}

// 获取所有课程列表（用于下拉框）
export function getAllCourses() {
  return request({
    url: '/admin/course/list',
    method: 'get',
    params: { page: 1, pageSize: 1000 } // 获取足够多的数据
  })
}

// 获取所有教师列表（用于下拉框）
export function getAllTeachers() {
  return request({
    url: '/admin/teacher/list',
    method: 'get',
    params: { page: 1, pageSize: 1000 }
  })
}