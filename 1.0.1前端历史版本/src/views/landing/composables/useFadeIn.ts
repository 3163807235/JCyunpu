/** Scroll reveal: use data-visible (not class) so Vue :class patches won't wipe it. */
export function useFadeIn(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null

  const reveal = (el: Element) => {
    el.setAttribute('data-visible', '')
  }

  onMounted(() => {
    const el = root.value
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodes = el.querySelectorAll('.fade-in')

    if (reduce) {
      nodes.forEach((n) => reveal(n))
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target)
            observer?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    nodes.forEach((n) => observer?.observe(n))
  })

  onUnmounted(() => observer?.disconnect())
}
