import { useEffect, useState } from 'react'

/**
 * Acompanha uma media query em JS.
 *
 * Existe pros casos em que esconder com CSS não basta — mapa dentro de um
 * `display:none` renderiza com tamanho zero e fica quebrado ao reaparecer.
 * Aqui a gente monta só o que está em uso.
 */
export function useMediaQuery(query) {
  const [combina, setCombina] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const aoMudar = (e) => setCombina(e.matches)
    setCombina(mql.matches)
    mql.addEventListener('change', aoMudar)
    return () => mql.removeEventListener('change', aoMudar)
  }, [query])

  return combina
}

// breakpoint lg do Tailwind: abaixo disso, mapa e lista não cabem lado a lado
export const useEhDesktop = () => useMediaQuery('(min-width: 1024px)')
