import React from 'react'
import { Outlet } from 'react-router-dom'

export const AgentLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-muted">
          <nav className="p-4">
            {/* Navigation items will be added here */}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AgentLayout
