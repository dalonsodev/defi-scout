import { useMemo, useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { RawPoolHistory } from '../../types'

interface ContractLinksProps {
  pool: RawPoolHistory
  chain?: string
}

const EXPLORER_URLS: Record<string, string> = { ethereum: 'https://etherscan.io' }

const truncateAddress = (address: string): string => {
  if (!address || address.length < 10) return 'N/A'
  return address.slice(0, 6) + '...' + address.slice(-4)
}

// 14×14, stroke="currentColor" inherits text color from btn-ghost
const CopyIcon = (): ReactNode => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = (): ReactNode => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="12 4 6 10 2 8" />
  </svg>
)

export function ContractLinks({ pool, chain = 'ethereum' }: ContractLinksProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  // Cleanup to avoid firing setCopiedId on a dead component
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const items = useMemo(
    () => [
      { id: 'pool', label: 'Pool', address: pool.id },
      { id: 'token0', label: pool.token0.symbol, address: pool.token0.id },
      { id: 'token1', label: pool.token1.symbol, address: pool.token1.id }
    ],
    [pool.id, pool.token0, pool.token1]
  )

  function handleCopy(id: string, address: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    navigator.clipboard.writeText(address)
    setCopiedId(id)
    timeoutRef.current = setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="glass-surface rounded-2xl p-4">
      <div className="mb-1 text-sm font-semibold">Contracts</div>
      {items.map((item) => (
        <div
          key={item.id}
          className="mt-1 flex items-center justify-between gap-2"
        >
          <span className="text-sm">{item.label}</span>
          <div>
            <button
              className="btn btn-glass btn-xs btn-circle mr-2"
              onClick={() => handleCopy(item.id, item.address)}
              aria-label="Copy contract address"
            >
              {copiedId === item.id ? <CheckIcon /> : <CopyIcon />}
            </button>
            <a
              href={`${EXPLORER_URLS[chain]}/address/${item.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              {truncateAddress(item.address)} ↗
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
