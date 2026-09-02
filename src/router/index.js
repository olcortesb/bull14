import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Models from '../views/Models.vue'
import Pricing from '../views/Pricing.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/models', component: Models },
  { path: '/pricing', component: Pricing },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
