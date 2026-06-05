'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, CreditCard, FileText, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const PLANS = [
  { id: 'FREE_TRIAL', name: 'Free Trial', price: 0, period: '30 days', features: ['Up to 30 students', '5 courses', '1GB storage', 'Basic AI features', 'Email support'], color: 'gray', popular: false },
  { id: 'STARTER', name: 'Starter', price: 29, period: 'per month', features: ['Up to 100 students', '20 courses', '10GB storage', 'AI Tutor & Homework', 'Chat support', 'Analytics'], color: 'blue', popular: false },
  { id: 'PROFESSIONAL', name: 'Professional', price: 79, period: 'per month', features: ['Up to 500 students', 'Unlimited courses', '50GB storage', 'Full AI suite', 'Live classroom', 'Priority support', 'White label'], color: 'purple', popular: true },
  { id: 'BUSINESS', name: 'Business', price: 199, period: 'per month', features: ['Up to 2,000 students', 'Unlimited everything', '200GB storage', 'Custom AI agents', 'API access', 'SLA support', 'Multi-school'], color: 'orange', popular: false },
  { id: 'ENTERPRISE', name: 'Enterprise', price: null, period: 'custom', features: ['Unlimited students', 'Dedicated infrastructure', 'Custom integrations', 'On-premise option', '24/7 dedicated support', 'Custom contracts'], color: 'gray', popular: false },
  { id: 'LIFETIME', name: 'Lifetime', price: 999, period: 'one time', features: ['Everything in Business', 'Lifetime updates', 'No recurring fees', 'Priority migrations', 'Founding member badge'], color: 'green', popular: false },
];

export default function BillingPage() {
  const { data: invoices } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => api.get('/billing/invoices').then(r => r.data.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (plan: string) => api.post('/billing/subscribe', { plan }).then(r => r.data.data),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => api.post('/billing/portal', { returnUrl: window.location.href }).then(r => r.data.data),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Choose the plan that fits your institution</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-600" />Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Free Trial</p>
              <p className="text-sm text-gray-500 mt-1">Your trial ends in 28 days. Upgrade to continue.</p>
            </div>
            <Button onClick={() => portalMutation.mutate()} loading={portalMutation.isPending} variant="outline">
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div key={plan.id} className={cn('relative bg-white rounded-xl border-2 p-6 flex flex-col', plan.popular ? 'border-blue-500 shadow-md' : 'border-gray-200')}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  {plan.price !== null ? (
                    <>
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500 text-sm ml-1">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">Contact Sales</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                {plan.price === null ? (
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => subscribeMutation.mutate(plan.id)}
                    loading={subscribeMutation.isPending}
                  >
                    {plan.price === 0 ? 'Start Free Trial' : 'Upgrade'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">PDF</th>
                </tr>
              </thead>
              <tbody>
                {(invoices ?? []).map((inv: any) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{inv.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium">${Number(inv.amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                        inv.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {inv.pdf && <a href={inv.pdf} className="text-blue-600 hover:underline text-xs">Download</a>}
                    </td>
                  </tr>
                ))}
                {!invoices?.length && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No invoices yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
