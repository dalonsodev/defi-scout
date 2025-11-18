import getRiskBadge from "../../utils/riskBadge"

export default function PoolCards({ pools }) {
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
         {pools.map(pool => (
            <div key={pool.id} className="card bg-base-200 shadow p-4">
               <h3 className="font-bold text-lg">{pool.name}</h3>
               <p className="text-sm">
                  Chain: <span className="font-medium">{pool.chain}</span> | 
                  APY: <span className="text-green-600 font-medium">{pool.apyBase}%</span> | 
                  TVL: <span className="font-medium">${pool.tvlFormatted}</span>
               </p>
               <p className="text-sm">Platform: <span className="font-medium">{pool.platformName}</span></p>
               <p className="text-sm">Vol (24h): <span className="font-medium">${pool.volumeFormatted}</span></p>
               <p className="text-sm">
                  Risk: <span className={`badge ${getRiskBadge(pool.riskLevel)}`}>{pool.riskLevel}</span>
               </p>
            </div>
         ))}
    </div>
   )
}