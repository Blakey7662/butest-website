// 修改後的 LocationList 核心顯示邏輯
{filteredLocations.map((loc) => {
  const isDone = todayReports.find(r => r.locationId === loc.id);
  return (
    <button
      key={loc.id}
      onClick={() => navigate(`/inspect/${loc.id}`)}
      className={`w-full bg-[#0f172a] p-5 rounded-3xl border ${isDone ? 'border-blue-500/50' : 'border-slate-800'} flex items-center justify-between group shadow-xl`}
    >
      <div className="flex items-center gap-4 text-left">
        <div className={`p-3 rounded-2xl ${isDone ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
          <MapPin size={22} />
        </div>
        <div>
          <div className="font-bold text-slate-100 flex items-center gap-2">
            {loc.name}
            {isDone && <CheckCircle size={14} className="text-blue-400" />}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 uppercase">
            {isDone ? `最後巡檢: ${isDone.time}` : '今日尚未巡檢'} 
            {isDone?.anomalyCount > 0 && <span className="ml-2 text-red-500">({isDone.anomalyCount} 異常)</span>}
          </div>
        </div>
      </div>
      <ChevronRight size={20} className="text-slate-700" />
    </button>
  );
})}