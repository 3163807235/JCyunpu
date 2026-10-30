<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
      <div class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4">
        <span class="text-g-700 text-sm">{{ item.des }}</span>
        <ArtCountTo class="text-[26px] font-medium mt-2" :target="item.num" :duration="1300" />
        <div class="flex-c mt-1">
          <span class="text-xs text-g-600">{{ item.hint }}</span>
          <span
            v-if="item.change"
            class="ml-1 text-xs font-semibold"
            :class="[item.change.indexOf('+') === -1 ? 'text-danger' : 'text-success']"
          >
            {{ item.change }}
          </span>
        </div>
        <div
          class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
        >
          <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  interface CardDataItem {
    des: string
    icon: string
    num: number
    hint: string
    change?: string
  }

  /**
   * 数据卡片：我的族谱 / 人物 / 附件 / 修谱项目 · 产品文档 §3.4 页面 01
   */
  const dataList = reactive<CardDataItem[]>([
    {
      des: '我的族谱',
      icon: 'ri:book-2-line',
      num: 3,
      hint: '本月新建',
      change: '+1'
    },
    {
      des: '总人物数',
      icon: 'ri:group-line',
      num: 128,
      hint: '额度已用 128/500'
    },
    {
      des: '附件数量',
      icon: 'ri:folder-image-line',
      num: 46,
      hint: '存储 86MB / 1GB'
    },
    {
      des: '修谱项目',
      icon: 'ri:file-list-3-line',
      num: 2,
      hint: '进行中'
    }
  ])
</script>
