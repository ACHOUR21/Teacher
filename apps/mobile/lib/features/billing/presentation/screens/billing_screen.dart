import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/api/endpoints.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _subscriptionProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final res = await apiClient.dio.get('${Endpoints.baseUrl}/billing/subscription');
    return (res.data['data'] ?? res.data) as Map<String, dynamic>?;
  } catch (_) {
    return null;
  }
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

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
    final subAsync = ref.watch(_subscriptionProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(title: const Text('Billing & Plans')),
      body: subAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _BillingBody(subscription: null, plans: _plans),
        data: (sub) => _BillingBody(subscription: sub, plans: _plans),
      ),
    );
  }
}

class _BillingBody extends ConsumerWidget {
  final Map<String, dynamic>? subscription;
  final List<_Plan> plans;
  const _BillingBody({required this.subscription, required this.plans});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoices = (subscription?['invoices'] as List<dynamic>?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _CurrentPlanCard(subscription: subscription, ref: ref),
        const SizedBox(height: 20),
        const Text('Available Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...plans.map((p) => _PlanCard(plan: p)),
        const SizedBox(height: 20),
        _InvoicesSection(invoices: invoices),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Current Plan Card
// ---------------------------------------------------------------------------

class _CurrentPlanCard extends ConsumerWidget {
  final Map<String, dynamic>? subscription;
  final WidgetRef ref;
  const _CurrentPlanCard({required this.subscription, required this.ref});

  String _planLabel(String? plan) {
    if (plan == null) return 'Free';
    return plan.replaceAll('_', ' ').toLowerCase().split(' ')
        .map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }

  String _statusLabel(String? status) => status?.toUpperCase() ?? 'INACTIVE';

  String _renewalText(String? periodEnd) {
    if (periodEnd == null) return '';
    final dt = DateTime.tryParse(periodEnd);
    if (dt == null) return '';
    return 'Renews ${_monthName(dt.month)} ${dt.day}, ${dt.year}';
  }

  String _monthName(int m) =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];

  Future<void> _openPortal(BuildContext context) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final returnUrl = '${Endpoints.baseUrl.replaceFirst('/api/v1', '')}/billing';
      final res = await apiClient.dio.post(
        '${Endpoints.baseUrl}/billing/portal',
        data: {'returnUrl': returnUrl},
      );
      final url = ((res.data['data'] ?? res.data) as Map<String, dynamic>)['url'] as String?;
      if (url != null) {
        final uri = Uri.tryParse(url);
        if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open billing portal'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plan = _planLabel(subscription?['plan'] as String?);
    final status = _statusLabel(subscription?['status'] as String?);
    final renewal = _renewalText(subscription?['currentPeriodEnd'] as String?);

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
                  child: Text(status, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(subscription == null ? 'No active plan' : plan,
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            if (renewal.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(renewal, style: const TextStyle(color: Colors.white60, fontSize: 12)),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white38),
                    ),
                    onPressed: subscription != null ? () => _openPortal(context) : null,
                    child: const Text('Manage'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.indigo,
                    ),
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

// ---------------------------------------------------------------------------
// Plan Card
// ---------------------------------------------------------------------------

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
                    text: plan.price == 0
                        ? (plan.period == 'Custom' ? 'Contact us' : 'Free')
                        : '\$${plan.price}',
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
                  : OutlinedButton(
                      onPressed: () {},
                      child: Text(plan.price == 0 && plan.period == 'Custom' ? 'Contact Sales' : 'Select Plan'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Invoices Section
// ---------------------------------------------------------------------------

class _InvoicesSection extends StatelessWidget {
  final List<dynamic> invoices;
  const _InvoicesSection({required this.invoices});

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '—';
    return '${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Invoice History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        if (invoices.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No invoices yet', style: TextStyle(color: Colors.grey))),
            ),
          )
        else
          Card(
            child: Column(
              children: invoices.asMap().entries.map((entry) {
                final i = entry.key;
                final inv = entry.value as Map<String, dynamic>;
                final status = (inv['status'] as String? ?? 'PENDING').toUpperCase();
                final isPaid = status == 'COMPLETED' || status == 'PAID';
                return Column(
                  children: [
                    ListTile(
                      title: Text(
                        inv['stripeInvoiceId'] as String? ?? 'INV-${inv['id']?.toString().substring(0, 8) ?? '?'}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      subtitle: Text(_formatDate(inv['issuedAt'] as String?)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '\$${(inv['amount'] as num?)?.toStringAsFixed(2) ?? '0.00'}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 8),
                          Chip(
                            label: Text(
                              isPaid ? 'Paid' : status,
                              style: TextStyle(
                                fontSize: 11,
                                color: isPaid ? Colors.green : Colors.orange,
                              ),
                            ),
                            backgroundColor: (isPaid ? Colors.green : Colors.orange).withOpacity(0.1),
                            padding: EdgeInsets.zero,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ],
                      ),
                      onTap: inv['pdf'] != null
                          ? () async {
                              final uri = Uri.tryParse(inv['pdf'] as String);
                              if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
                            }
                          : null,
                    ),
                    if (i < invoices.length - 1) const Divider(height: 1, indent: 16),
                  ],
                );
              }).toList(),
            ),
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

class _Plan {
  final String name;
  final int price;
  final String period;
  final List<String> features;
  final bool isRecommended;
  const _Plan(this.name, this.price, this.period, this.features, this.isRecommended);
}
