import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Menu flutuante ancorado num elemento.
 *
 * Existe porque um popover `absolute` morre dentro de qualquer ancestral com
 * `overflow-hidden` (o card de equipe, por exemplo): a lista aparece cortada e
 * o scroll interno dela não adianta, porque quem corta é o card de fora.
 * Aqui ele vai pro body via portal, com `position: fixed` calculado a partir
 * do retângulo da âncora — nenhum ancestral consegue clipar.
 *
 * Reposiciona no scroll/resize (captura, pra pegar containers internos) e vira
 * pra cima sozinho quando não cabe embaixo.
 */
export default function Popover({
  anchorRef,
  onFechar,
  largura = 224,
  alturaMax = 224,
  alinhamento = 'centro',   // 'centro' | 'esquerda' | 'direita'
  children,
}) {
  const [pos, setPos] = useState(null)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    let ultimo = ''
    const posiciona = () => {
      const alvo = anchorRef.current
      if (!alvo) return
      const r = alvo.getBoundingClientRect()
      const margem = 8

      // só recalcula quando a âncora de fato se moveu
      const assinatura = `${r.top}|${r.left}|${r.width}|${r.height}|${window.innerHeight}|${window.innerWidth}`
      if (assinatura === ultimo) return
      ultimo = assinatura

      // altura real do menu (limitada), pra decidir se cabe embaixo
      const alturaReal = Math.min(menuRef.current?.scrollHeight || alturaMax, alturaMax)
      const espacoAbaixo = window.innerHeight - r.bottom - margem
      const espacoAcima = r.top - margem
      const paraCima = espacoAbaixo < alturaReal && espacoAcima > espacoAbaixo

      let esquerda
      if (alinhamento === 'esquerda') esquerda = r.left
      else if (alinhamento === 'direita') esquerda = r.right - largura
      else esquerda = r.left + r.width / 2 - largura / 2

      // não deixa vazar pelas laterais da janela
      esquerda = Math.max(margem, Math.min(esquerda, window.innerWidth - largura - margem))

      setPos({
        left: esquerda,
        top: paraCima ? undefined : r.bottom + margem,
        bottom: paraCima ? window.innerHeight - r.top + margem : undefined,
        maxHeight: Math.min(alturaMax, (paraCima ? espacoAcima : espacoAbaixo)),
      })
    }

    posiciona()
    // capture=true porque 'scroll' não borbulha: quem rola é um container
    // interno da página, não a janela
    window.addEventListener('scroll', posiciona, true)
    window.addEventListener('resize', posiciona)
    return () => {
      window.removeEventListener('scroll', posiciona, true)
      window.removeEventListener('resize', posiciona)
    }
  }, [anchorRef, largura, alturaMax, alinhamento])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300]" onClick={onFechar} />
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[301] overflow-y-auto rounded-md"
        style={{
          left: pos?.left ?? -9999,
          top: pos?.top,
          bottom: pos?.bottom,
          width: largura,
          maxHeight: pos?.maxHeight ?? alturaMax,
          backgroundColor: '#ffffff',
          border: '1px solid #e3e2df',
          boxShadow: '0 8px 24px -8px rgba(20,22,36,0.2)',
          // sem posição ainda: esconde pra não piscar no canto
          visibility: pos ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </>,
    document.body
  )
}
