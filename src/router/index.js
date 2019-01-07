import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: resolve => require(['@com/Home'], resolve)
    },
    // {
    //   path: '/thisSite',
    //   component: resolve => require(['@com/thisSite'], resolve)
    // },
    // {
    //   path: '/terms',
    //   component: resolve => require(['@com/terms'], resolve)
    // },
    {
      path: '/login',
      component: resolve => require(['@com/login'], resolve)
    },
    {
      path: '/register',
      component: resolve => require(['@com/login'], resolve)
    },
    {
      path: '/article/:id',
      component: resolve => require(['@com/article/index'], resolve)
    },
    {
      path: '/addArticle',
      component: resolve => require(['@com/article/addArticle'], resolve)
    },
    {
      path: '*',
      component: resolve => require(['@pub/vue/error'], resolve)
    },
    {
      path: '/other',
      name: 'other',
      component: resolve => require(['@com/other/index'], resolve),
      children: [
        {
          path: 'thisSite',
          name: 'thisSite',
          component: resolve => require(['@com/other/thisSite'], resolve)
        },
        {
          path: 'terms',
          name: 'terms',
          component: resolve => require(['@com/other/terms'], resolve)
        }
      ]
    }
  ]
})
