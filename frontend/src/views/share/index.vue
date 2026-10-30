<!-- 族内只读分享 · 公开页 · §1.8.6 -->
<template>
  <div class="share-public min-h-screen bg-[var(--default-bg-color)]">
    <header
      class="border-b border-[var(--el-border-color)] bg-[var(--default-box-color)] px-4 py-4"
    >
      <div class="mx-auto max-w-4xl flex-cb flex-wrap gap-2">
        <div>
          <p class="text-xs text-g-500 mb-1">家传云谱 · 族内只读浏览</p>
          <h1 class="text-xl font-medium">{{ data?.genealogy.name || '加载中…' }}</h1>
        </div>
        <ElTag type="warning" effect="plain">只读 · 不可编辑导出</ElTag>
      </div>
    </header>

    <main v-loading="loading" class="mx-auto max-w-4xl px-4 py-6">
      <ElAlert v-if="error" type="error" :closable="false" :title="error" class="mb-4!" />

      <template v-if="data">
        <section class="art-card p-5 mb-5">
          <h2 class="text-base font-medium mb-3 inline-flex items-center gap-1">
            族谱概要
            <PageTipIcon
              content="在世人物按最严格脱敏展示（隐藏生卒明细）；私密人物不展示。"
            />
          </h2>
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="姓氏">{{
              data.genealogy.surname || '—'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="堂号">{{
              data.genealogy.hallName || '—'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="始祖">{{
              data.genealogy.ancestor || '—'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="人物数">{{ data.persons.length }}</ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <section class="art-card p-5 mb-5">
          <h2 class="text-base font-medium mb-3">人员一览</h2>
          <ElTable :data="data.persons" stripe max-height="420">
            <ElTableColumn prop="generation" label="世" width="70">
              <template #default="{ row }">第{{ row.generation }}世</template>
            </ElTableColumn>
            <ElTableColumn prop="nameWei" label="名讳" min-width="100" />
            <ElTableColumn prop="zibei" label="字辈" width="80">
              <template #default="{ row }">{{ row.zibei || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn label="在世" width="80">
              <template #default="{ row }">{{ row.isAlive === 1 ? '在世' : '已故' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="birthDate" label="生年" min-width="120">
              <template #default="{ row }">{{ row.birthDate || '—' }}</template>
            </ElTableColumn>
          </ElTable>
        </section>

        <section class="art-card p-5 mb-5">
          <h2 class="text-base font-medium mb-3">家规家训</h2>
          <ElEmpty v-if="!data.rules.length" description="暂无条目" />
          <div
            v-for="r in data.rules"
            :key="r.id"
            class="mb-4 pb-4 border-b border-[var(--el-border-color)] last:border-0"
          >
            <h3 class="font-medium">{{ r.title }}</h3>
            <p class="text-xs text-g-500 mb-2">{{ r.origin || '—' }}</p>
            <div class="text-sm text-g-700" v-html="r.content" />
          </div>
        </section>

        <section class="art-card p-5 mb-5">
          <h2 class="text-base font-medium mb-3">家族大事记</h2>
          <ElEmpty v-if="!data.events.length" description="暂无大事记" />
          <div v-for="e in data.events" :key="e.id" class="mb-3">
            <div class="flex flex-wrap gap-2 items-center mb-1">
              <span class="text-sm font-medium">{{ e.eventDate }}</span>
              <span class="text-sm">{{ e.title }}</span>
            </div>
            <div v-if="e.description" class="text-sm text-g-600" v-html="e.description" />
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useRoute } from 'vue-router'
  import { fetchSharePublicView } from '@/api/share'

  defineOptions({ name: 'SharePublic' })

  const route = useRoute()
  const loading = ref(false)
  const error = ref('')
  const data = ref<Api.ShareLink.PublicView | null>(null)

  const load = async () => {
    const token = String(route.params.token || '')
    if (!token) {
      error.value = '缺少分享令牌'
      return
    }
    loading.value = true
    error.value = ''
    data.value = null
    try {
      data.value = await fetchSharePublicView(token)
    } catch (e: any) {
      error.value = e?.message || '无法打开分享页'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  watch(() => route.params.token, load, { immediate: true })
</script>
