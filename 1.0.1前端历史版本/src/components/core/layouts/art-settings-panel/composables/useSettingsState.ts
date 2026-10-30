import { useSettingStore } from '@/store/modules/setting'
import { MenuTypeEnum } from '@/enums/appEnum'

/**
 * 设置状态管理
 */
export function useSettingsState() {
  const settingStore = useSettingStore()

  // 色弱模式初始化
  const initColorWeak = () => {
    if (settingStore.colorWeak) {
      const el = document.getElementsByTagName('html')[0]
      setTimeout(() => {
        el.classList.add('color-weak')
      }, 100)
    }
  }

  // 菜单布局切换（仅垂直 / 水平）
  const switchMenuLayouts = (type: MenuTypeEnum) => {
    if (type === MenuTypeEnum.LEFT) {
      settingStore.setMenuOpen(true)
    }
    settingStore.switchMenuLayouts(type)
  }

  return {
    // 方法
    initColorWeak,
    switchMenuLayouts
  }
}
