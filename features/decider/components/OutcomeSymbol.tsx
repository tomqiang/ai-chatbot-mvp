import Image from 'next/image'
import { OUTCOMES, type OutcomeId } from '../lib/outcomes'

export default function OutcomeSymbol({ id, size = 32 }: { id: OutcomeId; size?: number }) {
  const outcome = OUTCOMES[id]
  return outcome.image ? (
    <Image
      src={outcome.image}
      alt=""
      width={size}
      height={size}
      unoptimized
      style={{ borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', flexShrink: 0 }}
    />
  ) : <span aria-hidden="true" style={{ fontSize: size, verticalAlign: 'middle' }}>{outcome.emoji}</span>
}
