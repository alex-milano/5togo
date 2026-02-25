import { ZONES } from '../utils/balanceUtils'

export default function BalanceZoneIndicator({ zone, activeCount }) {
  const z = ZONES[zone] || ZONES.empty
  return (
    <div className={`zone-badge ${z.cls}`}>
      <span className="zone-count">{activeCount}</span>
      <span className="zone-msg">{z.msg}</span>
    </div>
  )
}
