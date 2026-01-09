'use client'

import POSInterface from '@/components/POSInterface'

export default function PosPage() {
    return (
        <div className="h-full flex flex-col">
            {/* El componente POS ya ocupa todo el alto internamente */}
            <div className="flex-1 overflow-hidden">
                <POSInterface />
            </div>
        </div>
    )
}