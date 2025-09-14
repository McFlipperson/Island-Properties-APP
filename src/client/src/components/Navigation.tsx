import { Link, useLocation } from 'react-router-dom'
import { Users, Globe, FileText, Home } from 'lucide-react'

export function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/expert-personas', label: 'Expert Personas', icon: Users },
    { path: '/platform-accounts', label: 'Platform Accounts', icon: Globe },
    { path: '/authority-content', label: 'Content', icon: FileText },
  ]
  
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="font-bold text-xl text-philippines-blue">
              GEO Expert Authority
            </div>
            
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-philippines-blue text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Philippines Real Estate Expert System
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}