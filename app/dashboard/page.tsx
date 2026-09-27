
export default function Dashboard(){
  return (
    <main className="min-h-screen bg-[#FFFEF9] p-8">
      <h1 className="font-serif text-[28px]">Dashboard ILQ</h1>
      <p className="text-[12px] opacity-60 mt-2">Build clean - routes directes /board et /play - Next 14.2.35 patched</p>
      <div className="mt-6">
        <a href="/board/ILQ-TEST01" className="bg-black text-white px-4 py-2 rounded-full text-[13px] mr-2">Board</a>
        <a href="/joueur/ILQ-TEST01" className="border px-4 py-2 rounded-full text-[13px]">Play</a>
      </div>
    </main>
  )
}
