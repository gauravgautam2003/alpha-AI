const SkeletonBlock = ({ className = "" }) => (
    <div className={`skeleton-block ${className}`} aria-hidden="true" />
)

const SidebarSkeleton = () => (
    <aside className="skeleton-sidebar hidden lg:flex w-90 h-screen shrink-0 flex-col">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
            <SkeletonBlock className="w-7 h-7 rounded-lg" />
            <SkeletonBlock className="w-8 h-8 rounded-[0.8rem]" />
            <div className="flex-1 space-y-2">
                <SkeletonBlock className="w-24 h-3 rounded" />
                <SkeletonBlock className="w-16 h-2 rounded" />
            </div>
            <SkeletonBlock className="w-10 h-4 rounded-full" />
        </div>

        <div className="px-4 pt-4 pb-5">
            <SkeletonBlock className="w-full h-10 rounded-xl" />
        </div>

        <div className="px-5 pb-3">
            <SkeletonBlock className="w-24 h-2 rounded" />
        </div>

        <div className="space-y-2 px-2.5">
            {["w-40", "w-48", "w-36", "w-44", "w-32"].map((width, index) => (
                <div key={index} className="flex items-center gap-2.5 px-3 py-2.5">
                    <SkeletonBlock className="w-7 h-7 rounded-lg" />
                    <SkeletonBlock className={`${width} max-w-[calc(100%-2.75rem)] h-3 rounded`} />
                </div>
            ))}
        </div>

        <div className="mt-auto mx-2.5 h-px bg-white/6" />
        <div className="flex items-center gap-2.5 px-5 py-4">
            <SkeletonBlock className="w-9 h-9 rounded-[10px]" />
            <div className="flex-1 space-y-2">
                <SkeletonBlock className="w-20 h-3 rounded" />
                <SkeletonBlock className="w-14 h-2 rounded" />
            </div>
            <SkeletonBlock className="w-6 h-6 rounded" />
        </div>
    </aside>
)

const ChatSkeleton = () => (
    <main className="relative flex-1 min-w-0 flex flex-col">
        <header className="skeleton-panel h-16 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-white/10">
            <SkeletonBlock className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-2">
                <SkeletonBlock className="w-32 h-3 rounded" />
                <SkeletonBlock className="w-20 h-2 rounded" />
            </div>
            <SkeletonBlock className="hidden sm:block w-20 h-5 rounded-full" />
            <SkeletonBlock className="w-9 h-9 rounded-xl" />
        </header>

        <div className="flex-1 px-4 md:px-8 py-6">
            <div className="max-w-4xl mx-auto flex flex-col gap-7 pt-8">
                <div className="self-start w-full max-w-[460px] space-y-2">
                    <SkeletonBlock className="w-full h-4 rounded" />
                    <SkeletonBlock className="w-3/4 h-4 rounded" />
                </div>
                <div className="self-end w-full max-w-[380px] space-y-2">
                    <SkeletonBlock className="w-full h-12 rounded-2xl" />
                </div>
                <div className="self-start w-full max-w-[520px] space-y-2">
                    <SkeletonBlock className="w-full h-4 rounded" />
                    <SkeletonBlock className="w-5/6 h-4 rounded" />
                    <SkeletonBlock className="w-2/5 h-4 rounded" />
                </div>
            </div>
        </div>

        <div className="px-4 md:px-8 pb-5">
            <div className="skeleton-panel max-w-4xl mx-auto h-14 rounded-2xl flex items-center gap-3 px-4">
                <SkeletonBlock className="flex-1 h-3 rounded" />
                <SkeletonBlock className="w-8 h-8 rounded-xl" />
            </div>
        </div>
    </main>
)

const ArtifactSkeleton = () => (
    <aside className="skeleton-panel hidden xl:flex w-[400px] h-full shrink-0 flex-col border-l border-white/10">
        <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10">
            <SkeletonBlock className="w-7 h-7 rounded-lg" />
            <SkeletonBlock className="w-24 h-3 rounded" />
            <SkeletonBlock className="ml-auto w-16 h-6 rounded-lg" />
        </div>
        <div className="flex gap-2 px-4 py-3 border-b border-white/10">
            <SkeletonBlock className="w-20 h-3 rounded" />
            <SkeletonBlock className="w-24 h-3 rounded" />
        </div>
        <div className="p-5 space-y-3">
            {["w-4/5", "w-full", "w-11/12", "w-3/5", "w-full", "w-4/5", "w-full", "w-2/3"].map((width, index) => (
                <SkeletonBlock key={index} className={`${width} h-3 rounded`} />
            ))}
        </div>
    </aside>
)

const AppSkeleton = () => (
    <div className="app-shell h-screen flex text-slate-700 overflow-hidden" aria-label="Loading Alpha AI">
        <SidebarSkeleton />
        <ChatSkeleton />
        <ArtifactSkeleton />
    </div>
)

export default AppSkeleton
