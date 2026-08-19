import React from 'react'

function Artifact() {
  return (
    <aside className='glass-panel hidden xl:flex h-full border-l border-white/70 flex-col overflow-hidden shrink-0 w-[280px]'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-sky-100/80'>
        <span className='text-sm font-semibold text-slate-700'>Artifacts</span>
        <span className='text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 px-2 py-1 rounded-full'>Live</span>
      </div>
      <div className='flex-1 flex items-center justify-center px-6'>
        <div className='glass-subtle rounded-2xl px-4 py-5 text-center'>
          <div className='mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600'>✦</div>
          <p className='text-sm font-medium text-slate-600'>Your canvas is ready</p>
          <p className='mt-1 text-xs leading-relaxed text-slate-400'>Generated files and rich results will appear here.</p>
        </div>
      </div>
    </aside>
  )
}

export default Artifact
