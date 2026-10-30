<template>
  <div class="art-card h-105 p-4 box-border mb-5 max-sm:mb-4">
    <div class="art-card-header mb-3">
      <div class="title">
        <h4>快捷操作</h4>
        <p>常用入口</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="item in actions"
        :key="item.key"
        type="button"
        class="flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-theme/5 border border-transparent hover:border-theme/20"
        @click="onAction(item)"
      >
        <div class="size-10 rounded-xl flex-cc shrink-0 bg-theme/10">
          <ArtSvgIcon :icon="item.icon" class="text-lg text-theme" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium truncate">{{ item.title }}</p>
          <p class="text-xs text-g-500 mt-0.5 truncate">{{ item.desc }}</p>
        </div>
      </button>
    </div>

    <div class="mt-5 ml-1">
      <h3 class="text-base font-medium">本周概览</h3>
      <p class="mt-1 text-sm text-g-600">新增人物、附件与版本保存次数较上周变化</p>
    </div>
    <div class="flex-b mt-3 px-1">
      <div class="flex-1" v-for="(item, index) in list" :key="index">
        <p class="text-2xl text-g-900">{{ item.num }}</p>
        <p class="text-xs text-g-500">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { mittBus } from '@/utils/sys'

  interface UserStatItem {
    name: string
    num: string
  }

  interface QuickAction {
    key: string
    title: string
    desc: string
    icon: string
    path?: string
    subscriptionTab?: string
  }

  const router = useRouter()

  const actions: QuickAction[] = [
    { key: 'create', title: '创建新族谱', desc: '弹窗完成基础信息', icon: 'ri:add-circle-line', path: '/genealogies' },
    { key: 'recent', title: '最近族谱', desc: '进入我的族谱列表', icon: 'ri:history-line', path: '/genealogies' },
    {
      key: 'purchase',
      title: '购买套餐',
      desc: '续费与扩容',
      icon: 'ri:shopping-bag-3-line',
      subscriptionTab: 'purchase'
    },
    {
      key: 'quota',
      title: '额度流水',
      desc: '查看消耗明细',
      icon: 'ri:exchange-funds-line',
      subscriptionTab: 'quota'
    }
  ]

  const onAction = (item: QuickAction) => {
    if (item.subscriptionTab) {
      mittBus.emit('openSubscription', item.subscriptionTab)
      return
    }
    if (item.path) router.push(item.path)
  }

  const list: UserStatItem[] = [
    { name: '新增人物', num: '12' },
    { name: '上传附件', num: '5' },
    { name: '版本保存', num: '3' },
    { name: '成员加入', num: '1' }
  ]
</script>
