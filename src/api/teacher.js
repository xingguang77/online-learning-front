import request from '@/utils/request'

//-----管理员管理教师模块接口-----
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


//----教师模块接口-----

export default {
  // 获取班级列表（含未回答数）
  getMyClasses() {
    return request({
      url: '/teacher/classes',
      method: 'get'
    })
  },

  // 获取问题列表
  getClassQuestions(classId, status) {
    return request({
      url: '/teacher/questions',
      method: 'get',
      params: { classId, status }
    })
  },
  // 获取问题列表 (支持 status 过滤)
  getClassQuestions(classId, status) {
    return request({
      url: `/teacher/questions/${classId}`,
      method: 'get',
      params: { status } // 会自动拼接到 URL: ?status=0
    })
  },

  // 回答问题
  replyQuestion(data) {
    return request({
      url: '/teacher/reply',
      method: 'post',
      data
    })
  },
  
  // 修改回答
  updateAnswer(data) {
    return request({
      url: '/teacher/answer',
      method: 'put',
      data
    })
  },

  // 删除回答
  deleteAnswer(answerId) {
    return request({
      url: `/teacher/answer/${answerId}`,
      method: 'delete'
    })
  },

  // 发布资源
  publishResource(data) {
    return request({
      url: '/teacher/resource',
      method: 'post',
      data
    })
  },

  // 新增：获取回答详情
  getAnswer(questionId) {
    return request({
      url: `/teacher/answer/${questionId}`,
      method: 'get'
    })
  }
}