import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../providers/flashcards_provider.dart';

/// Deck list screen — entry point for the Flashcards feature.
class FlashcardsScreen extends ConsumerWidget {
  const FlashcardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final decksAsync = ref.watch(flashcardDecksProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Flashcards'),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome_outlined),
            tooltip: 'Generate with AI',
            onPressed: () => _showAIGenerateDialog(context, ref),
          ),
        ],
      ),
      body: decksAsync.when(
        loading: () => const _DeckListSkeleton(),
        error: (e, _) => _ErrorRetry(
          message: e.toString(),
          onRetry: () => ref.invalidate(flashcardDecksProvider),
        ),
        data: (decks) {
          if (decks.isEmpty) {
            return _EmptyDecks(
              onCreateDeck: () => _showCreateDeckDialog(context, ref),
              onGenerateAI: () => _showAIGenerateDialog(context, ref),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(flashcardDecksProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: decks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _DeckCard(
                deck: decks[index],
                onStudy: () =>
                    context.push('/home/flashcards/${decks[index].id}'),
                onDelete: () =>
                    _confirmDelete(context, ref, decks[index]),
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateDeckDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('New Deck'),
      ),
    );
  }

  Future<void> _showCreateDeckDialog(
      BuildContext context, WidgetRef ref) async {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Create Deck'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Deck title',
                hintText: 'e.g. Spanish Vocab',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Create'),
          ),
        ],
      ),
    );

    if (confirmed == true && titleController.text.trim().isNotEmpty) {
      try {
        final repo = ref.read(flashcardsRepositoryProvider);
        await repo.createDeck(
          title: titleController.text.trim(),
          description: descController.text.trim().isEmpty
              ? null
              : descController.text.trim(),
        );
        ref.invalidate(flashcardDecksProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to create deck: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _showAIGenerateDialog(
      BuildContext context, WidgetRef ref) async {
    final topicController = TextEditingController();
    final countController = TextEditingController(text: '10');
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.auto_awesome,
                color: Theme.of(context).colorScheme.primary, size: 20),
            const SizedBox(width: 8),
            const Text('Generate with AI'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: topicController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Topic',
                hintText: 'e.g. Photosynthesis, French Revolution',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: countController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Number of cards',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Generate'),
          ),
        ],
      ),
    );

    if (confirmed == true && topicController.text.trim().isNotEmpty) {
      final count = int.tryParse(countController.text.trim()) ?? 10;
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Generating ${count} flashcards for "${topicController.text.trim()}"…'),
            duration: const Duration(seconds: 3),
          ),
        );
      }
      try {
        final repo = ref.read(flashcardsRepositoryProvider);
        // First create a deck, then populate it with AI-generated cards
        final deck = await repo.createDeck(
          title: topicController.text.trim(),
          description: 'AI-generated deck',
        );
        final cards = await repo.generateWithAI(
          topic: topicController.text.trim(),
          count: count,
        );
        for (final card in cards) {
          await repo.addCard(
              deckId: deck.id, front: card.front, back: card.back);
        }
        ref.invalidate(flashcardDecksProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Created "${deck.title}" with ${cards.length} cards'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('AI generation failed: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, FlashcardDeckEntity deck) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete deck?'),
        content: Text('Delete "${deck.title}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await ref.read(flashcardsRepositoryProvider).deleteDeck(deck.id);
        ref.invalidate(flashcardDecksProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete deck: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Deck Card
// ---------------------------------------------------------------------------

class _DeckCard extends StatelessWidget {
  final FlashcardDeckEntity deck;
  final VoidCallback onStudy;
  final VoidCallback onDelete;

  const _DeckCard({
    required this.deck,
    required this.onStudy,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final progress = deck.progressPercent;

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onStudy,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.style_rounded,
                      color: colorScheme.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          deck.title,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (deck.description != null &&
                            deck.description!.isNotEmpty)
                          Text(
                            deck.description!,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: Colors.grey.shade600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  PopupMenuButton<_DeckAction>(
                    onSelected: (action) {
                      if (action == _DeckAction.delete) onDelete();
                    },
                    itemBuilder: (_) => [
                      const PopupMenuItem(
                        value: _DeckAction.delete,
                        child: Row(
                          children: [
                            Icon(Icons.delete_outline, size: 18),
                            SizedBox(width: 8),
                            Text('Delete'),
                          ],
                        ),
                      ),
                    ],
                    icon: const Icon(Icons.more_vert, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _Chip(
                    icon: Icons.credit_card_outlined,
                    label: '${deck.cardCount} cards',
                  ),
                  const SizedBox(width: 8),
                  _Chip(
                    icon: Icons.check_circle_outline,
                    label: '${deck.knownCount} known',
                    color: Colors.green,
                  ),
                ],
              ),
              if (deck.cardCount > 0) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: colorScheme.primary.withOpacity(0.1),
                          valueColor:
                              AlwaysStoppedAnimation<Color>(colorScheme.primary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${(progress * 100).toStringAsFixed(0)}%',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: colorScheme.primary,
                          ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: deck.cardCount > 0 ? onStudy : null,
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: const Text('Study Now'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum _DeckAction { delete }

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _Chip({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: c),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, color: c, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

class _EmptyDecks extends StatelessWidget {
  final VoidCallback onCreateDeck;
  final VoidCallback onGenerateAI;

  const _EmptyDecks({required this.onCreateDeck, required this.onGenerateAI});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.style_outlined,
                  size: 48, color: Colors.grey.shade300),
            ),
            const SizedBox(height: 20),
            Text(
              'No flashcard decks yet',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Create a deck manually or let AI generate one for you.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, height: 1.5),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onCreateDeck,
              icon: const Icon(Icons.add),
              label: const Text('Create Deck'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onGenerateAI,
              icon: const Icon(Icons.auto_awesome_outlined),
              label: const Text('Generate with AI'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

class _DeckListSkeleton extends StatelessWidget {
  const _DeckListSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Container(
        height: 160,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error + retry
// ---------------------------------------------------------------------------

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded,
                size: 56, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text('Failed to load flashcard decks',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(message,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                maxLines: 3,
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
