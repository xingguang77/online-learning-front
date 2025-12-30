import { createRouter, createWebHistory } from 'vue-router'

// 首页组件
import AdminHome from '../views/admin/AdminHome.vue'
import TeacherHome from '../views/teacher/TeacherHome.vue'
import StudentHome from '../views/student/StudentHome.vue'

import LayoutView from '../views/layout/index.vue'
import LoginView from '../views/login/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: LayoutView,
      // 根路径重定向逻辑保持不变
      redirect: () => {
        const loginUserStr = localStorage.getItem('loginUser')
        if (loginUserStr) {
          const user = JSON.parse(loginUserStr)
          const role = Number(user.userType)
          if (role === 1) return '/admin/course'
          if (role === 2) return '/teacher'
          if (role === 3) return '/student'
        }
        return '/login'
      },
      // ⭐ 这里是重点修改的地方：添加具体的管理子路由
      children: [
        // // === 管理员路由 ===
        // { 
        //   path: 'admin', 
        //   name: 'AdminHome',
        //   component: AdminHome, 
        //   meta: { role: 1, title: '管理员首页' } 
        // },
        // 新增：课程管理
        { 
          path: 'admin/course', 
          name: 'AdminCourse',
          // 建议使用懒加载（import），这样首屏加载更快
          component: () => import('../views/admin/course.vue'), 
          meta: { role: 1, title: '课程管理' } 
        },
        // 新增：教师管理
        { 
          path: 'admin/teacher', 
          name: 'AdminTeacher',
          component: () => import('../views/admin/teacher.vue'), 
          meta: { role: 1, title: '教师管理' } 
        },
        // 新增：班级管理
        { 
          path: 'admin/class', 
          name: 'AdminClass',
          component: () => import('../views/admin/class.vue'), 
          meta: { role: 1, title: '班级管理' } 
        },

        // ========== 教师端路由 ==========
        { 
          path: 'teacher',   // 默认跳转到工作台
          name: 'TeacherDashboard',
          component: () => import('../views/teacher/TeacherHome.vue'), 
          meta: { role: 2, title: '教师工作台' } 
        },
        {
          path: 'teacher/qa', // 答疑中心
          name: 'TeacherQA',
          component: () => import('../views/teacher/QuestionList.vue'),
          meta: { role: 2, title: '答疑中心' }
        },
        {
          path: 'teacher/publish', // 资源发布
          name: 'TeacherPublish',
          component: () => import('../views/teacher/ResourcePublish.vue'),
          meta: { role: 2, title: '资源发布' }
        },
      ]
    }
  ]
})

// 路由守卫保持你原来的代码即可，逻辑是正确的
router.beforeEach((to, from, next) => {
  const loginUserStr = localStorage.getItem('loginUser')

  if (to.path === '/login') {
    next()
    return
  }

  if (!loginUserStr) {
    next('/login')
    return
  }

  try {
    const loginUser = JSON.parse(loginUserStr)
    const { token, userType } = loginUser

    if (!token) {
      next('/login')
      return
    }

    // 权限校验
    if (to.meta.role && to.meta.role !== userType) {
      console.warn('权限不符，拦截访问')
      // 可以跳转到由 Layout 包裹的 403 页面，或者直接回登录页
      next('/login') 
      return
    }

    next()
  } catch (e) {
    localStorage.clear()
    next('/login')
  }
})

export default router