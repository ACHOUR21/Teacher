import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface CreateDeckDto {
  title: string;
  subject?: string;
  topic?: string;
  isPublic?: boolean;
  cards?: { front: string; back: string; hint?: string }[];
}

export interface ReviewCardDto {
  cardId: string;
  rating: number; // 0-5 (SM-2 scale)
}

// SM-2 spaced repetition algorithm
function sm2(
  rating: number,
  prevInterval: number,
  prevEaseFactor: number,
): { interval: number; easeFactor: number; nextReview: Date } {
  let easeFactor = prevEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (easeFactor < 1.3) {easeFactor = 1.3;}

  let interval: number;
  if (rating < 3) {
    interval = 1; // failed — reset
  } else if (prevInterval === 0) {
    interval = 1;
  } else if (prevInterval === 1) {
    interval = 6;
  } else {
    interval = Math.round(prevInterval * easeFactor);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { interval, easeFactor, nextReview };
}

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDeck(tenantId: string, userId: string, dto: CreateDeckDto) {
    return this.prisma.flashcardDeck.create({
      data: {
        tenantId,
        createdBy: userId,
        title: dto.title,
        subject: dto.subject,
        topic: dto.topic,
        isPublic: dto.isPublic ?? false,
        ...(dto.cards?.length && {
          cards: {
            create: dto.cards.map((c, i) => ({
              front: c.front,
              back: c.back,
              hint: c.hint,
              order: i + 1,
            })),
          },
        }),
      },
      include: { cards: { orderBy: { order: 'asc' } } },
    });
  }

  async listDecks(tenantId: string, userId: string) {
    return this.prisma.flashcardDeck.findMany({
      where: {
        tenantId,
        OR: [{ createdBy: userId }, { isPublic: true }],
      },
      include: {
        _count: { select: { cards: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeck(deckId: string) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { cards: { orderBy: { order: 'asc' } } },
    });
    if (!deck) {throw new NotFoundException('Deck not found');}
    return deck;
  }

  async deleteDeck(deckId: string, userId: string) {
    const deck = await this.prisma.flashcardDeck.findUnique({ where: { id: deckId } });
    if (!deck) {throw new NotFoundException('Deck not found');}
    if (deck.createdBy !== userId) {throw new ForbiddenException('Only the creator can delete this deck');}
    await this.prisma.flashcardDeck.delete({ where: { id: deckId } });
  }

  // Returns cards due for review today (or new cards with no review)
  async getDueCards(deckId: string, userId: string) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { cards: { orderBy: { order: 'asc' } } },
    });
    if (!deck) {throw new NotFoundException('Deck not found');}

    const reviews = await this.prisma.flashcardReview.findMany({
      where: { userId, card: { deckId } },
    });
    const reviewMap = new Map(reviews.map((r) => [r.cardId, r]));

    const now = new Date();
    return deck.cards.filter((card) => {
      const review = reviewMap.get(card.id);
      if (!review) {return true;} // never reviewed
      return review.nextReview <= now;
    });
  }

  async reviewCard(userId: string, dto: ReviewCardDto) {
    const card = await this.prisma.flashcard.findUnique({ where: { id: dto.cardId } });
    if (!card) {throw new NotFoundException('Card not found');}

    const existing = await this.prisma.flashcardReview.findUnique({
      where: { cardId_userId: { cardId: dto.cardId, userId } },
    });

    const prevInterval = existing?.interval ?? 0;
    const prevEaseFactor = existing?.easeFactor ?? 2.5;
    const { interval, easeFactor, nextReview } = sm2(dto.rating, prevInterval, prevEaseFactor);

    return this.prisma.flashcardReview.upsert({
      where: { cardId_userId: { cardId: dto.cardId, userId } },
      create: { cardId: dto.cardId, userId, rating: dto.rating, interval, easeFactor, nextReview },
      update: { rating: dto.rating, interval, easeFactor, nextReview, reviewedAt: new Date() },
    });
  }

  async getStudyStats(deckId: string, userId: string) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { _count: { select: { cards: true } } },
    });
    if (!deck) {throw new NotFoundException('Deck not found');}

    const reviews = await this.prisma.flashcardReview.findMany({
      where: { userId, card: { deckId } },
    });

    const now = new Date();
    const due = reviews.filter((r) => r.nextReview <= now).length;
    const learned = reviews.length;
    const total = deck._count.cards;

    return { total, learned, due, new: total - learned };
  }
}
