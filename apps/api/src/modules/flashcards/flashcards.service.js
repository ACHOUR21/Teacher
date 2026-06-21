"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FlashcardsService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
// SM-2 spaced repetition algorithm
function sm2(rating, prevInterval, prevEaseFactor) {
  let easeFactor = prevEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  let interval;
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
  return {
    interval,
    easeFactor,
    nextReview
  };
}
let FlashcardsService = exports.FlashcardsService = class FlashcardsService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async createDeck(tenantId, userId, dto) {
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
              order: i + 1
            }))
          }
        })
      },
      include: {
        cards: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
  }
  async listDecks(tenantId, userId) {
    return this.prisma.flashcardDeck.findMany({
      where: {
        tenantId,
        OR: [{
          createdBy: userId
        }, {
          isPublic: true
        }]
      },
      include: {
        _count: {
          select: {
            cards: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  async getDeck(deckId) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: {
        id: deckId
      },
      include: {
        cards: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    if (!deck) {
      throw new _common.NotFoundException('Deck not found');
    }
    return deck;
  }
  async deleteDeck(deckId, userId) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: {
        id: deckId
      }
    });
    if (!deck) {
      throw new _common.NotFoundException('Deck not found');
    }
    if (deck.createdBy !== userId) {
      throw new _common.ForbiddenException('Only the creator can delete this deck');
    }
    await this.prisma.flashcardDeck.delete({
      where: {
        id: deckId
      }
    });
  }
  // Returns cards due for review today (or new cards with no review)
  async getDueCards(deckId, userId) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: {
        id: deckId
      },
      include: {
        cards: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    if (!deck) {
      throw new _common.NotFoundException('Deck not found');
    }
    const reviews = await this.prisma.flashcardReview.findMany({
      where: {
        userId,
        card: {
          deckId
        }
      }
    });
    const reviewMap = new Map(reviews.map(r => [r.cardId, r]));
    const now = new Date();
    return deck.cards.filter(card => {
      const review = reviewMap.get(card.id);
      if (!review) {
        return true;
      } // never reviewed
      return review.nextReview <= now;
    });
  }
  async reviewCard(userId, dto) {
    const card = await this.prisma.flashcard.findUnique({
      where: {
        id: dto.cardId
      }
    });
    if (!card) {
      throw new _common.NotFoundException('Card not found');
    }
    const existing = await this.prisma.flashcardReview.findUnique({
      where: {
        cardId_userId: {
          cardId: dto.cardId,
          userId
        }
      }
    });
    const prevInterval = existing?.interval ?? 0;
    const prevEaseFactor = existing?.easeFactor ?? 2.5;
    const {
      interval,
      easeFactor,
      nextReview
    } = sm2(dto.rating, prevInterval, prevEaseFactor);
    return this.prisma.flashcardReview.upsert({
      where: {
        cardId_userId: {
          cardId: dto.cardId,
          userId
        }
      },
      create: {
        cardId: dto.cardId,
        userId,
        rating: dto.rating,
        interval,
        easeFactor,
        nextReview
      },
      update: {
        rating: dto.rating,
        interval,
        easeFactor,
        nextReview,
        reviewedAt: new Date()
      }
    });
  }
  async getStudyStats(deckId, userId) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: {
        id: deckId
      },
      include: {
        _count: {
          select: {
            cards: true
          }
        }
      }
    });
    if (!deck) {
      throw new _common.NotFoundException('Deck not found');
    }
    const reviews = await this.prisma.flashcardReview.findMany({
      where: {
        userId,
        card: {
          deckId
        }
      }
    });
    const now = new Date();
    const due = reviews.filter(r => r.nextReview <= now).length;
    const learned = reviews.length;
    const total = deck._count.cards;
    return {
      total,
      learned,
      due,
      new: total - learned
    };
  }
};
exports.FlashcardsService = FlashcardsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], FlashcardsService);