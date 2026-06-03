import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import PreviewPage from '@/pages/PreviewPage.vue'
import FillPage from '@/pages/FillPage.vue'
import AnalysisPage from '@/pages/AnalysisPage.vue'
import ExportPage from '@/pages/ExportPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/editor/:id', name: 'editor', component: EditorPage },
    { path: '/settings/:id', name: 'settings', component: SettingsPage },
    { path: '/preview/:id', name: 'preview', component: PreviewPage },
    { path: '/fill/:id', name: 'fill', component: FillPage },
    { path: '/analysis/:id', name: 'analysis', component: AnalysisPage },
    { path: '/export/:id', name: 'export', component: ExportPage }
  ]
})

export default router
