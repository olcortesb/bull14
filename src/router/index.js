import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Models from '../views/Models.vue'
import Pricing from '../views/Pricing.vue'
import Tools from '../views/Tools.vue'
import Hardware from '../views/Hardware.vue'
import Changelog from '../views/Changelog.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/models', component: Models },
  { path: '/pricing', component: Pricing },
  { path: '/tools', component: Tools },
  { path: '/hardware', component: Hardware },
  { path: '/changelog', component: Changelog },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
