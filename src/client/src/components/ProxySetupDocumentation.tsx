import React, { useState } from 'react';

interface ProxyConfigInfo {
  host: string;
  port: string;
  location: string;
  type: string;
}

interface ProxySetupDocumentationProps {
  proxyConfig: ProxyConfigInfo;
  onClose: () => void;
}

export function ProxySetupDocumentation({ proxyConfig, onClose }: ProxySetupDocumentationProps) {
  const [activeTab, setActiveTab] = useState<'browser' | 'platforms' | 'verification'>('browser');

  const tabs = [
    { id: 'browser', label: 'Browser Setup', icon: '🌐' },
    { id: 'platforms', label: 'Platform Config', icon: '📱' },
    { id: 'verification', label: 'Verification', icon: '✅' }
  ];

  const BrowserSetupContent = () => (
    <div className="space-y-6">
      {/* Chrome Setup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full flex items-center justify-center text-white text-sm font-bold">C</div>
          <h3 className="text-lg font-semibold">Chrome Browser Setup</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Method 1: Chrome Settings (Recommended)</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Open Chrome and go to <code className="bg-gray-100 px-2 py-1 rounded">chrome://settings/</code></li>
              <li>Click "Advanced" → "System"</li>
              <li>Click "Open your computer's proxy settings"</li>
              <li>Set Manual proxy configuration:
                <div className="mt-2 bg-gray-50 p-3 rounded border">
                  <div className="font-mono text-sm">
                    <div><strong>HTTP Proxy:</strong> {proxyConfig.host}:{proxyConfig.port}</div>
                    <div><strong>HTTPS Proxy:</strong> {proxyConfig.host}:{proxyConfig.port}</div>
                    <div><strong>SOCKS Proxy:</strong> {proxyConfig.host}:{proxyConfig.port}</div>
                  </div>
                </div>
              </li>
              <li>Save settings and restart Chrome</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Method 2: Chrome Extension</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Install "Proxy SwitchyOmega" from Chrome Web Store</li>
              <li>Create new profile: "Manila Proxy"</li>
              <li>Configure proxy server:
                <div className="mt-2 bg-gray-50 p-3 rounded border">
                  <div className="font-mono text-sm">
                    <div><strong>Protocol:</strong> HTTP</div>
                    <div><strong>Server:</strong> {proxyConfig.host}</div>
                    <div><strong>Port:</strong> {proxyConfig.port}</div>
                  </div>
                </div>
              </li>
              <li>Apply changes and activate profile</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Firefox Setup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">F</div>
          <h3 className="text-lg font-semibold">Firefox Browser Setup</h3>
        </div>
        
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Open Firefox and go to <code className="bg-gray-100 px-2 py-1 rounded">about:preferences</code></li>
          <li>Scroll down to "Network Settings" → Click "Settings..."</li>
          <li>Select "Manual proxy configuration"</li>
          <li>Enter proxy details:
            <div className="mt-2 bg-gray-50 p-3 rounded border">
              <div className="font-mono text-sm">
                <div><strong>HTTP Proxy:</strong> {proxyConfig.host} Port: {proxyConfig.port}</div>
                <div><strong>SSL Proxy:</strong> {proxyConfig.host} Port: {proxyConfig.port}</div>
                <div>☑️ Use this proxy server for all protocols</div>
              </div>
            </div>
          </li>
          <li>Click "OK" and restart Firefox</li>
        </ol>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 mb-2">⚠️ Important Security Notes</h4>
        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
          <li>Always use incognito/private browsing when creating platform accounts</li>
          <li>Clear browser cache and cookies before each session</li>
          <li>Use different browser profiles for each expert persona</li>
          <li>Never access personal accounts while proxy is active</li>
        </ul>
      </div>
    </div>
  );

  const PlatformConfigContent = () => (
    <div className="space-y-6">
      {/* Medium Setup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">M</div>
          <h3 className="text-lg font-semibold">Medium Account Creation</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">✅ <strong>Philippines proxy verified</strong> - Safe to create Medium account</p>
          </div>
          
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Navigate to <code className="bg-gray-100 px-2 py-1 rounded">medium.com</code> in proxy-configured browser</li>
            <li>Click "Sign up" and use Philippines-based email address</li>
            <li>Complete profile with Philippines real estate expertise:
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Professional headshot photo</li>
                <li>Manila/Philippines location in bio</li>
                <li>Real estate expertise focus areas</li>
                <li>Local market experience highlights</li>
              </ul>
            </li>
            <li>Write initial article about Philippines real estate market</li>
            <li>Engage with local real estate content to build authority</li>
          </ol>
        </div>
      </div>

      {/* Reddit Setup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">R</div>
          <h3 className="text-lg font-semibold">Reddit Account Creation</h3>
        </div>
        
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Go to <code className="bg-gray-100 px-2 py-1 rounded">reddit.com</code> with proxy active</li>
          <li>Create account with Philippines-relevant username</li>
          <li>Join Philippines real estate subreddits:
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><code className="bg-gray-100 px-2 py-1 rounded">r/Philippines</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">r/phinvest</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">r/phclassifieds</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">r/RealEstate</code></li>
            </ul>
          </li>
          <li>Build karma by commenting helpfully on Philippines real estate topics</li>
          <li>Create valuable posts about Manila property market insights</li>
        </ol>
      </div>

      {/* Quora Setup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">Q</div>
          <h3 className="text-lg font-semibold">Quora Account Creation</h3>
        </div>
        
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Visit <code className="bg-gray-100 px-2 py-1 rounded">quora.com</code> through Manila proxy</li>
          <li>Sign up with professional Philippines-based email</li>
          <li>Complete detailed profile:
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Add Philippines real estate credentials</li>
              <li>List specific Manila market expertise</li>
              <li>Include professional experience and education</li>
            </ul>
          </li>
          <li>Follow Philippines real estate topics and spaces</li>
          <li>Answer questions about Manila property market with detailed expertise</li>
          <li>Create Quora Space for Philippines real estate insights</li>
        </ol>
      </div>
    </div>
  );

  const VerificationContent = () => (
    <div className="space-y-6">
      {/* IP Verification */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🌐 IP Location Verification</h3>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-green-800">Current Proxy Location</div>
                <div className="text-lg text-green-900">{proxyConfig.location}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-green-800">Proxy Type</div>
                <div className="text-lg text-green-900">{proxyConfig.type}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Verification Steps</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Visit <code className="bg-gray-100 px-2 py-1 rounded">whatismyipaddress.com</code></li>
              <li>Confirm location shows as "Manila, Philippines" or nearby</li>
              <li>Check <code className="bg-gray-100 px-2 py-1 rounded">iplocation.net</code> for additional verification</li>
              <li>Test with <code className="bg-gray-100 px-2 py-1 rounded">ipinfo.io</code> to ensure consistent results</li>
              <li>Save screenshots as proof of Philippines location</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Platform Detection Test */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Platform Detection Test</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Test how platforms detect your location:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded border">
              <h4 className="font-medium text-gray-900 mb-2">Google</h4>
              <p className="text-xs text-gray-600">Visit google.com and check if results are Philippines-focused</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border">
              <h4 className="font-medium text-gray-900 mb-2">Facebook</h4>
              <p className="text-xs text-gray-600">Location suggestions should show Philippines cities</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border">
              <h4 className="font-medium text-gray-900 mb-2">LinkedIn</h4>
              <p className="text-xs text-gray-600">Job suggestions should be Philippines-based</p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔧 Troubleshooting</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-red-600 mb-2">Common Issues & Solutions</h4>
            
            <div className="space-y-3">
              <div className="border-l-4 border-yellow-400 pl-4">
                <div className="font-medium text-gray-900">Connection Timeout</div>
                <div className="text-sm text-gray-600">Check proxy credentials and try switching browser</div>
              </div>
              
              <div className="border-l-4 border-yellow-400 pl-4">
                <div className="font-medium text-gray-900">Wrong Location Detected</div>
                <div className="text-sm text-gray-600">Clear browser cache, restart browser, or try incognito mode</div>
              </div>
              
              <div className="border-l-4 border-yellow-400 pl-4">
                <div className="font-medium text-gray-900">Platform Account Suspended</div>
                <div className="text-sm text-gray-600">Switch to different browser profile and wait 24 hours before retry</div>
              </div>
              
              <div className="border-l-4 border-red-400 pl-4">
                <div className="font-medium text-gray-900">Proxy Not Working</div>
                <div className="text-sm text-gray-600">Contact support immediately - proxy credentials may have changed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'browser': return <BrowserSetupContent />;
      case 'platforms': return <PlatformConfigContent />;
      case 'verification': return <VerificationContent />;
      default: return <BrowserSetupContent />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manila Proxy Setup Guide</h2>
            <p className="text-gray-600 mt-1">Complete setup instructions for Philippines real estate authority building</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              🇵🇭 Proxy Location: <strong>Manila, Philippines</strong> • Status: <strong className="text-green-600">Active</strong>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Got it, Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}