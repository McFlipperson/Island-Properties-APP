export function AuthorityContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authority Content</h1>
        <p className="text-gray-600">Manage AI citation-optimized expert content</p>
      </div>
      
      <div className="card p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Authority Content</h3>
        <p className="text-gray-600 mb-4">Create expert content to build authority and generate AI citations</p>
        <button className="btn-primary">Create Content</button>
      </div>
    </div>
  )
}