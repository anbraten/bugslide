<template>
  <!-- 2x2 grid of SidebarStat with dividers between the cells -->
  <dl
    class="grid grid-cols-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl [&>div:nth-child(odd)]:border-r [&>div:nth-child(-n+2)]:border-b [&>div]:border-slate-100 dark:[&>div]:border-zinc-800"
  >
    <slot />
  </dl>
</template>
