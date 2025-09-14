import { Users, Globe, FileText, TrendingUp } from 'lucide-react'

export function Dashboard() {
  const stats = [
    {
      title: 'Expert Personas',
      value: '0',
      icon: Users,
      color: 'bg-blue-500',
      description: 'Active real estate experts'
    },
    {
      title: 'Platform Accounts', 
      value: '0',
      icon: Globe,
      color: 'bg-green-500',
      description: 'Connected social accounts'
    },
    {
      title: 'Content Published',
      value: '0',
      icon: FileText,
      color: 'bg-purple-500',
      description: 'Authority content pieces'
    },
    {
      title: 'Monthly Consultations',
      value: '0',
      icon: TrendingUp,
      color: 'bg-authority-gold',
      description: 'Consultation requests'
    }
  ]
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Philippines Real Estate Expert Authority Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          AI Citation-Optimized Expert Authority Lead Generation System
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">{stat.description}</p>
            </div>
          )
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            GEO Platform Strategy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-900">Medium</span>
                <span className="ml-2 text-sm text-gray-600">Phase 1 - Priority</span>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Ready to Setup
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-900">Reddit</span>
                <span className="ml-2 text-sm text-gray-600">Phase 2 - High Priority</span>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                Pending
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-900">Quora</span>
                <span className="ml-2 text-sm text-gray-600">Phase 3 - High Priority</span>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                Pending
              </span>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expert Authority Status
          </h3>
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Users className="w-12 h-12 mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Expert Personas Yet
              </h4>
              <p className="text-gray-600 mb-4">
                Create your first Philippines real estate expert to start building authority
              </p>
              <button className="btn-primary">
                Create Expert Persona
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}