export default function Placeholder({ titulo, descricao }) {
  return (
    <div className="p-10">
      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-3">
      </div>
      <h1 className="text-3xl text-neutral-100 mb-2">{titulo}</h1>
      <p className="text-neutral-500 text-sm max-w-lg">{descricao}</p>
    </div>
  )
}
