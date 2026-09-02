import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Models from '../views/Models.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/models', component: Models },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
