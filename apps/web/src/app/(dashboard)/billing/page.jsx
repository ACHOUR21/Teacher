'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, CreditCard, FileText, Zap, Tag, TrendingUp, DollarSign, Users, BarChart3, AlertTriangle, CheckCircle, } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
// ------------------------------------------------------------------ plan data
const PLANS = [
    {
        id: 'FREE_TRIAL', name: 'Free Trial', price: 0, period: '30 days',
        features: ['30 students', '5 courses', '1 GB storage', 'Basic features', 'Email support'],
        color: 'gray', popular: false,
    },
    {
        id: 'STARTER', name: 'Starter', price: 29, period: 'mo',
        features: ['100 students', '20 courses', '10 GB storage', 'AI Tutor', 'Analytics', 'Certificates'],
        color: 'blue', popular: false,
    },
    {
        id: 'PROFESSIONAL', name: 'Professional', price: 79, period: 'mo',
        features: ['500 students', 'Unlimited courses', '50 GB storage', 'Full AI suite', 'Live classroom', 'White label'],
        color: 'purple', popular: true,
    },
    {
        id: 'BUSINESS', name: 'Business', price: 199, period: 'mo',
        features: ['2,000 students', 'Unlimited everything', '200 GB storage', 'API access', 'Multi-school', 'SLA support'],
        color: 'orange', popular: false,
    },
    {
        id: 'ENTERPRISE', name: 'Enterprise', price: null, period: 'custom',
        features: ['Unlimited students', 'Dedicated infra', 'Custom integrations', 'On-premise option', '24/7 support'],
        color: 'slate', popular: false,
    },
    {
        id: 'LIFETIME', name: 'Lifetime', price: 999, period: 'once',
        features: ['Everything in Business', 'Lifetime updates', 'No recurring fees', 'Founding member badge'],
        color: 'green', popular: false,
    },
];
const STATUS_STYLES = {
    ACTIVE: 'bg-green-100 text-green-700',
    TRIALING: 'bg-blue-100 text-blue-700',
    PAST_DUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    INACTIVE: 'bg-gray-100 text-gray-500',
};
// ------------------------------------------------------------------ sub-components
function RevenueCard({ label, value, sub, icon: Icon, color }) {
    return (<div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', color)}>
        <Icon className="h-4.5 w-4.5"/>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>);
}
function CouponInput() {
    const [code, setCode] = useState('');
    const [result, setResult] = useState(null);
    const mutation = useMutation({
        mutationFn: (couponCode) => api.post('/billing/coupon/apply', { couponCode }).then(r => r.data.data),
        onSuccess: (data) => setResult({ ok: true, message: data.message }),
        onError: (err) => setResult({ ok: false, message: err.response?.data?.message ?? 'Invalid coupon' }),
    });
    return (<div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
          <input type="text" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null); }} placeholder="COUPON CODE" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <Button onClick={() => mutation.mutate(code)} loading={mutation.isPending} disabled={!code.trim()} variant="outline" className="flex-shrink-0">
          Apply
        </Button>
      </div>
      {result && (<p className={cn('text-xs flex items-center gap-1.5', result.ok ? 'text-green-600' : 'text-red-500')}>
          {result.ok ? <CheckCircle className="h-3.5 w-3.5"/> : <AlertTriangle className="h-3.5 w-3.5"/>}
          {result.message}
        </p>)}
    </div>);
}
// ------------------------------------------------------------------ main page
export default function BillingPage() {
    const [annualBilling, setAnnualBilling] = useState(false);
    const { data: subscription } = useQuery({
        queryKey: ['billing', 'subscription'],
        queryFn: () => api.get('/billing/subscription').then(r => r.data.data),
    });
    const { data: invoices } = useQuery({
        queryKey: ['billing', 'invoices'],
        queryFn: () => api.get('/billing/invoices').then(r => r.data.data),
    });
    const { data: analytics } = useQuery({
        queryKey: ['billing', 'analytics'],
        queryFn: () => api.get('/billing/analytics').then(r => r.data.data),
    });
    const subscribeMutation = useMutation({
        mutationFn: (plan) => api.post('/billing/subscribe', {
            plan,
            successUrl: `${window.location.origin}/billing?success=1`,
            cancelUrl: window.location.href,
        }).then(r => r.data.data),
        onSuccess: (data) => {
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        },
    });
    const portalMutation = useMutation({
        mutationFn: () => api.post('/billing/portal', { returnUrl: window.location.href }).then(r => r.data.data),
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url;
            }
        },
    });
    const currentPlan = subscription?.plan ?? 'FREE_TRIAL';
    const subStatus = subscription?.status ?? 'INACTIVE';
    const periodEnd = subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;
    return (<div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and review your invoices</p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600"/> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-lg">
                  {PLANS.find(p => p.id === currentPlan)?.name ?? currentPlan}
                </p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_STYLES[subStatus] ?? 'bg-gray-100 text-gray-500')}>
                  {subStatus}
                </span>
                {subscription?.cancelAtPeriodEnd && (<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    Cancels {periodEnd}
                  </span>)}
              </div>
              {periodEnd && !subscription?.cancelAtPeriodEnd && (<p className="text-sm text-gray-500">Renews {periodEnd}</p>)}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => portalMutation.mutate()} loading={portalMutation.isPending} variant="outline">
                Manage Subscription
              </Button>
            </div>
          </div>

          {/* Coupon */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Have a coupon?</p>
            <CouponInput />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics (admin view) */}
      {analytics && (<div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500"/> Revenue Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <RevenueCard label="Total Revenue" value={`$${analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="bg-green-50 text-green-600"/>
            <RevenueCard label="MRR" value={`$${analytics.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`ARR ~$${Math.round(analytics.arr).toLocaleString()}`} icon={TrendingUp} color="bg-blue-50 text-blue-600"/>
            <RevenueCard label="Active Plans" value={analytics.planDistribution.reduce((s, p) => s + p.count, 0).toString()} icon={Users} color="bg-purple-50 text-purple-600"/>
            <RevenueCard label="Churn (30d)" value={analytics.churnLast30Days.toString()} sub="subscriptions cancelled" icon={AlertTriangle} color={analytics.churnLast30Days > 0 ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}/>
          </div>
        </div>)}

      {/* Pricing Plans */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Available Plans</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn('text-gray-500', !annualBilling && 'text-gray-900 font-medium')}>Monthly</span>
            <button onClick={() => setAnnualBilling(a => !a)} className={cn('relative h-5 w-9 rounded-full transition-colors', annualBilling ? 'bg-blue-600' : 'bg-gray-300')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', annualBilling ? 'translate-x-4' : 'translate-x-0.5')}/>
            </button>
            <span className={cn('text-gray-500', annualBilling && 'text-gray-900 font-medium')}>
              Annual <span className="text-green-600 font-medium">–20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan;
            const displayPrice = plan.price !== null && plan.price > 0 && annualBilling && plan.period === 'mo'
                ? Math.round(plan.price * 0.8)
                : plan.price;
            return (<div key={plan.id} className={cn('relative bg-white rounded-xl border-2 p-6 flex flex-col transition-shadow', plan.popular ? 'border-blue-500 shadow-md' : isCurrent ? 'border-green-500' : 'border-gray-200')}>
                {plan.popular && (<div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3"/> Most Popular
                    </span>
                  </div>)}
                {isCurrent && !plan.popular && (<div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>)}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    {displayPrice !== null ? (displayPrice === 0 ? (<span className="text-2xl font-bold text-gray-900">Free</span>) : (<>
                          <span className="text-3xl font-bold text-gray-900">${displayPrice}</span>
                          <span className="text-gray-500 text-sm ml-1">/{plan.period}</span>
                          {annualBilling && plan.period === 'mo' && (<span className="ml-2 text-xs text-green-600 font-medium">billed annually</span>)}
                        </>)) : (<span className="text-2xl font-bold text-gray-900">Contact Sales</span>)}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map(f => (<li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0"/>
                        {f}
                      </li>))}
                  </ul>
                </div>
                <div className="mt-6">
                  {plan.price === null ? (<Button variant="outline" className="w-full">Contact Sales</Button>) : isCurrent ? (<Button variant="outline" className="w-full" disabled>Current Plan</Button>) : (<Button className="w-full" variant={plan.popular ? 'default' : 'outline'} onClick={() => subscribeMutation.mutate(plan.id)} loading={subscribeMutation.isPending}>
                      {plan.price === 0 ? 'Start Free Trial' : 'Upgrade'}
                    </Button>)}
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600"/> Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">PDF</th>
                </tr>
              </thead>
              <tbody>
                {(invoices?.invoices ?? []).map((inv) => (<tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{inv.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-medium">${Number(inv.amount).toFixed(2)} <span className="text-gray-400 text-xs">{inv.currency}</span></td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', inv.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {inv.pdf
                ? <a href={inv.pdf} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Download</a>
                : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>))}
                {!invoices?.invoices?.length && (<tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No invoices yet</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>);
}
