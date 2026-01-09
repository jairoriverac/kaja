import { Wifi, ShieldCheck, Database } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="h-8 bg-slate-900 text-slate-400 text-xs px-6 flex items-center justify-between select-none">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Wifi size={12} className="text-green-500" />
                    Conectado
                </span>
                <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Database size={12} className="text-blue-400" />
                    Supabase Sync
                </span>
            </div>

            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    Kaja POS &copy; {new Date().getFullYear()}
                </span>
                <span>v0.1.0-alpha</span>
            </div>
        </footer>
    )
}