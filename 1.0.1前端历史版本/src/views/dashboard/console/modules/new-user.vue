<template>
  <div class="art-card p-5 h-128 overflow-hidden mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>族谱快捷入口</h4>
        <p>共 <span class="text-theme">{{ tableData.length }}</span> 部族谱</p>
      </div>
      <ElButton type="primary" v-ripple @click="router.push('/genealogies')">管理族谱</ElButton>
    </div>
    <ArtTable
      class="w-full"
      :data="tableData"
      style="width: 100%"
      size="large"
      :border="false"
      :stripe="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <ElTableColumn label="族谱" prop="name" min-width="140">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <div class="size-9 rounded-lg flex-cc bg-theme/10 shrink-0">
                <ArtSvgIcon icon="ri:book-2-line" class="text-theme" />
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium">{{ scope.row.name }}</p>
                <p class="text-xs text-g-500 truncate">{{ scope.row.hallName || '未设堂号' }}</p>
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="始祖" prop="ancestor" min-width="80" />
        <ElTableColumn label="人物" prop="personCount" width="80" />
        <ElTableColumn label="模式" width="100">
          <template #default="scope">
            <ElTag size="small" type="info">
              {{ scope.row.mode === 'standard' ? '标准' : '简易' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default>
            <ElButton link type="primary" @click="router.push('/genealogies')">进入</ElButton>
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  /** Mock 族谱列表，建谱闭环后接真实接口 */
  const tableData = reactive<Api.Genealogy.Item[]>([
    {
      id: 1,
      name: '颍川陈氏族谱',
      hallName: '德星堂',
      ancestor: '陈寔',
      privacy: 2,
      mode: 'standard',
      personCount: 86,
      attachmentCount: 12,
      projectCount: 1,
      currentStage: 2,
      createdAt: '2026-08-01'
    },
    {
      id: 2,
      name: '太原王氏家谱',
      hallName: '三槐堂',
      ancestor: '王元',
      privacy: 1,
      mode: 'simple',
      personCount: 32,
      attachmentCount: 4,
      projectCount: 1,
      currentStage: 1,
      createdAt: '2026-08-20'
    },
    {
      id: 3,
      name: '陇西李氏支谱',
      hallName: '',
      ancestor: '李耳',
      privacy: 3,
      mode: 'standard',
      personCount: 10,
      attachmentCount: 1,
      projectCount: 1,
      currentStage: 1,
      createdAt: '2026-09-01'
    }
  ])
</script>
