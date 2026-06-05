import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BillingScreen extends ConsumerWidget {
  const BillingScreen({super.key});

  static const _plans = [
    _Plan('Free Trial', 0, '14 days', ['5 courses', '2 AI sessions/day', 'Basic analytics'], false),
    _Plan('Starter', 29, '/month', ['Unlimited courses', '20 AI sessions/day', 'Advanced analytics', 'Email support'], false),
    _Plan('Professional', 79, '/month', ['Everything in Starter', 'Unlimited AI', 'White label', 'API access', 'Priority support'], true),
    _Plan('Enterprise', 0, 'Custom', ['Custom limits', 'Dedicated infra', 'SLA', 'Custom integrations'], false),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(title: const Text('Billing & Plans')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _CurrentPlanCard(),
          const SizedBox(height: 20),
          const Text('Available Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ..._plans.map((p) => _PlanCard(plan: p)),
          const SizedBox(height: 20),
          _InvoicesSection(),
        ],
      ),
    );
  }
}

class _CurrentPlanCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.indigo,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Current Plan', style: TextStyle(color: Colors.white70, fontSize: 13)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text('Professional', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const Text('\$79 / month', style: TextStyle(color: Colors.white70, fontSize: 14)),
            const SizedBox(height: 16),
            const Text('Renews Mar 15, 2026', style: TextStyle(color: Colors.white60, fontSize: 12)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white38)),
                    onPressed: () {},
                    child: const Text('Manage'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.indigo),
                    onPressed: () {},
                    child: const Text('Upgrade'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final _Plan plan;
  const _PlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: plan.isRecommended
            ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 2)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(plan.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                if (plan.isRecommended)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text('POPULAR', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: plan.price == 0 ? (plan.period == 'Custom' ? 'Contact us' : 'Free') : '\$${plan.price}',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
                  ),
                  if (plan.price > 0)
                    TextSpan(
                      text: ' ${plan.period}',
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            ...plan.features.map((f) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, size: 16, color: Colors.green),
                  const SizedBox(width: 8),
                  Text(f, style: const TextStyle(fontSize: 14)),
                ],
              ),
            )),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: plan.isRecommended
                  ? FilledButton(onPressed: () {}, child: const Text('Get Started'))
                  : OutlinedButton(onPressed: () {}, child: Text(plan.price == 0 && plan.period == 'Custom' ? 'Contact Sales' : 'Select Plan')),
            ),
          ],
        ),
      ),
    );
  }
}

class _InvoicesSection extends StatelessWidget {
  static const _invoices = [
    ('INV-2025-003', 'Feb 15, 2025', '\$79.00', 'Paid'),
    ('INV-2025-002', 'Jan 15, 2025', '\$79.00', 'Paid'),
    ('INV-2025-001', 'Dec 15, 2024', '\$79.00', 'Paid'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Invoice History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: _invoices.asMap().entries.map((entry) {
              final i = entry.key;
              final (id, date, amount, status) = entry.value;
              return Column(
                children: [
                  ListTile(
                    title: Text(id, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(date),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(amount, style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        Chip(
                          label: Text(status, style: const TextStyle(fontSize: 11, color: Colors.green)),
                          backgroundColor: Colors.green.withOpacity(0.1),
                          padding: EdgeInsets.zero,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ],
                    ),
                    onTap: () {},
                  ),
                  if (i < _invoices.length - 1) const Divider(height: 1, indent: 16),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _Plan {
  final String name;
  final int price;
  final String period;
  final List<String> features;
  final bool isRecommended;

  const _Plan(this.name, this.price, this.period, this.features, this.isRecommended);
}
