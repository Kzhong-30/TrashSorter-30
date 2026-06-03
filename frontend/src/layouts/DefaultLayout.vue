<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="default-layout">
    <RouterView />
  </div>
</template>

<style scoped>
.default-layout {
  min-height: 100vh;
}
</style>
