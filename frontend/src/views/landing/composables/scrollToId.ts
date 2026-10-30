const NAV_OFFSET = 72

export function scrollToId(id: string) {
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const target = document.getElementById(id)
  if (!target) return
  const top = target.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
}
