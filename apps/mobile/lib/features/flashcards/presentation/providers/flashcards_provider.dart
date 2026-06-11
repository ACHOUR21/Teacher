import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/flashcards_repository.dart';
import '../../domain/entities/flashcard_entity.dart';

// ---------------------------------------------------------------------------
// Repository provider
// ---------------------------------------------------------------------------

final flashcardsRepositoryProvider = Provider<FlashcardsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return FlashcardsRepository(apiClient: apiClient);
});

// ---------------------------------------------------------------------------
// Decks list
// ---------------------------------------------------------------------------

final flashcardDecksProvider =
    FutureProvider.autoDispose<List<FlashcardDeckEntity>>((ref) async {
  final repo = ref.watch(flashcardsRepositoryProvider);
  return repo.getDecks();
});

// ---------------------------------------------------------------------------
// Cards inside a specific deck
// ---------------------------------------------------------------------------

final deckCardsProvider = FutureProvider.autoDispose
    .family<List<FlashcardEntity>, String>((ref, deckId) async {
  final repo = ref.watch(flashcardsRepositoryProvider);
  return repo.getCardsInDeck(deckId);
});

// ---------------------------------------------------------------------------
// Study session notifier — tracks current card index & known/unknown state
// during a study session for a single deck.
// ---------------------------------------------------------------------------

class StudySessionState {
  final List<FlashcardEntity> cards;
  final int currentIndex;
  final bool isFlipped;
  final bool isComplete;

  const StudySessionState({
    required this.cards,
    required this.currentIndex,
    required this.isFlipped,
    required this.isComplete,
  });

  StudySessionState copyWith({
    List<FlashcardEntity>? cards,
    int? currentIndex,
    bool? isFlipped,
    bool? isComplete,
  }) {
    return StudySessionState(
      cards: cards ?? this.cards,
      currentIndex: currentIndex ?? this.currentIndex,
      isFlipped: isFlipped ?? this.isFlipped,
      isComplete: isComplete ?? this.isComplete,
    );
  }

  FlashcardEntity? get currentCard =>
      cards.isNotEmpty && currentIndex < cards.length
          ? cards[currentIndex]
          : null;

  int get knownCount => cards.where((c) => c.isKnown).length;
}

class StudySessionNotifier extends StateNotifier<StudySessionState> {
  final FlashcardsRepository _repo;
  final String deckId;

  StudySessionNotifier(this._repo, this.deckId)
      : super(const StudySessionState(
          cards: [],
          currentIndex: 0,
          isFlipped: false,
          isComplete: false,
        ));

  Future<void> loadCards() async {
    final cards = await _repo.getCardsInDeck(deckId);
    state = state.copyWith(
      cards: cards,
      currentIndex: 0,
      isFlipped: false,
      isComplete: cards.isEmpty,
    );
  }

  void flip() {
    state = state.copyWith(isFlipped: !state.isFlipped);
  }

  Future<void> markKnown(bool known) async {
    final card = state.currentCard;
    if (card == null) return;

    // Optimistic UI update
    final updated = state.cards.map((c) {
      return c.id == card.id ? c.copyWith(isKnown: known) : c;
    }).toList();

    final next = state.currentIndex + 1;
    final done = next >= state.cards.length;

    state = state.copyWith(
      cards: updated,
      currentIndex: done ? state.currentIndex : next,
      isFlipped: false,
      isComplete: done,
    );

    // Persist to API silently
    try {
      await _repo.markKnown(deckId, card.id, known);
    } catch (_) {
      // silently ignore — progress is tracked locally for the session
    }
  }

  void restart() {
    state = state.copyWith(
      currentIndex: 0,
      isFlipped: false,
      isComplete: false,
      cards: state.cards.map((c) => c.copyWith(isKnown: false)).toList(),
    );
  }
}

final studySessionProvider = StateNotifierProvider.autoDispose
    .family<StudySessionNotifier, StudySessionState, String>(
        (ref, deckId) {
  final repo = ref.watch(flashcardsRepositoryProvider);
  return StudySessionNotifier(repo, deckId);
});
