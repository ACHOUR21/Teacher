import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/flashcards_provider.dart';

/// Interactive card-flip study session for a single deck.
class StudySessionScreen extends ConsumerStatefulWidget {
  final String deckId;

  const StudySessionScreen({super.key, required this.deckId});

  @override
  ConsumerState<StudySessionScreen> createState() => _StudySessionScreenState();
}

class _StudySessionScreenState extends ConsumerState<StudySessionScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;
  bool _loadingKnown = false;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOut),
    );

    // Load cards for this deck
    Future.microtask(() {
      ref.read(studySessionProvider(widget.deckId).notifier).loadCards();
    });
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flip() {
    ref.read(studySessionProvider(widget.deckId).notifier).flip();
    if (_flipController.isCompleted) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
  }

  Future<void> _markKnown(bool known) async {
    if (_loadingKnown) return;
    setState(() => _loadingKnown = true);

    // Reset flip animation before advancing
    _flipController.value = 0;

    await ref.read(studySessionProvider(widget.deckId).notifier).markKnown(known);
    if (mounted) setState(() => _loadingKnown = false);
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(studySessionProvider(widget.deckId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study'),
        actions: [
          if (session.cards.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '${math.min(session.currentIndex + 1, session.cards.length)} / ${session.cards.length}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ),
        ],
      ),
      body: session.cards.isEmpty && !session.isComplete
          ? const Center(child: CircularProgressIndicator())
          : session.isComplete
              ? _CompletionView(
                  total: session.cards.length,
                  known: session.knownCount,
                  onRestart: () => ref
                      .read(studySessionProvider(widget.deckId).notifier)
                      .restart(),
                )
              : _StudyView(
                  session: session,
                  flipAnimation: _flipAnimation,
                  onFlip: _flip,
                  onKnown: () => _markKnown(true),
                  onUnknown: () => _markKnown(false),
                  loading: _loadingKnown,
                ),
    );
  }
}

// ---------------------------------------------------------------------------
// Study view — flip card + action buttons
// ---------------------------------------------------------------------------

class _StudyView extends StatelessWidget {
  final StudySessionState session;
  final Animation<double> flipAnimation;
  final VoidCallback onFlip;
  final VoidCallback onKnown;
  final VoidCallback onUnknown;
  final bool loading;

  const _StudyView({
    required this.session,
    required this.flipAnimation,
    required this.onFlip,
    required this.onKnown,
    required this.onUnknown,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final card = session.currentCard;
    if (card == null) return const SizedBox.shrink();

    return Column(
      children: [
        // Progress bar
        LinearProgressIndicator(
          value: session.cards.isEmpty
              ? 0
              : session.currentIndex / session.cards.length,
          minHeight: 4,
          backgroundColor: Colors.grey.shade200,
          valueColor: AlwaysStoppedAnimation(
              Theme.of(context).colorScheme.primary),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 8),
                Text(
                  session.isFlipped ? 'Answer' : 'Question',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade500,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 16),
                // Flip card
                Expanded(
                  child: GestureDetector(
                    onTap: onFlip,
                    child: AnimatedBuilder(
                      animation: flipAnimation,
                      builder: (context, child) {
                        final angle = flipAnimation.value * math.pi;
                        final isBack = flipAnimation.value > 0.5;
                        return Transform(
                          transform: Matrix4.rotationY(angle),
                          alignment: Alignment.center,
                          child: isBack
                              ? Transform(
                                  transform: Matrix4.rotationY(math.pi),
                                  alignment: Alignment.center,
                                  child: _CardFace(
                                    text: card.back,
                                    isBack: true,
                                  ),
                                )
                              : _CardFace(
                                  text: card.front,
                                  isBack: false,
                                ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tap card to flip',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                ),
                const SizedBox(height: 24),
                // Action buttons — only active after flip
                AnimatedOpacity(
                  opacity: session.isFlipped ? 1.0 : 0.4,
                  duration: const Duration(milliseconds: 200),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed:
                              session.isFlipped && !loading ? onUnknown : null,
                          icon: const Icon(Icons.close_rounded,
                              color: Colors.red),
                          label: const Text('Still learning',
                              style: TextStyle(color: Colors.red)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.red),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed:
                              session.isFlipped && !loading ? onKnown : null,
                          icon: loading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white),
                                )
                              : const Icon(Icons.check_rounded),
                          label: const Text('Got it!'),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CardFace extends StatelessWidget {
  final String text;
  final bool isBack;

  const _CardFace({required this.text, required this.isBack});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: isBack ? colorScheme.primaryContainer : colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isBack
              ? colorScheme.primary.withOpacity(0.3)
              : colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: isBack
                  ? colorScheme.onPrimaryContainer
                  : colorScheme.onSurface,
              height: 1.5,
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Completion view
// ---------------------------------------------------------------------------

class _CompletionView extends StatelessWidget {
  final int total;
  final int known;
  final VoidCallback onRestart;

  const _CompletionView({
    required this.total,
    required this.known,
    required this.onRestart,
  });

  @override
  Widget build(BuildContext context) {
    final percent = total == 0 ? 0.0 : known / total;
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: percent >= 0.8
                    ? Colors.green.shade50
                    : colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${(percent * 100).toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: percent >= 0.8 ? Colors.green.shade700 : colorScheme.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              percent >= 0.8 ? 'Great job!' : 'Keep practising!',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'You knew $known out of $total cards.',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: onRestart,
              icon: const Icon(Icons.replay_rounded),
              label: const Text('Study Again'),
              style: FilledButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Back to Decks'),
            ),
          ],
        ),
      ),
    );
  }
}
