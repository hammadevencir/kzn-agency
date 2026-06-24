import { SubscriptionsIcon } from '@/components/icons'

function SubscriptionPage() {
  return (
    <div className="flex items-center justify-center h-full">
      {/* Coming Soon Content */}
      <div className="text-center max-w-md mx-4">
        {/* Coming Soon Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-primary/40 rounded-full flex items-center justify-center">
            <SubscriptionsIcon className="text-white w-12 h-12" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Subscriptions Coming Soon
        </h1>
        
        {/* Message */}
        <p className="text-white/90 mb-8 leading-relaxed">
          We're working to bring you subscription management features. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}

export default SubscriptionPage
