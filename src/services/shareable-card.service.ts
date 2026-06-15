/**
 * Shareable Card Service
 * Business logic for generating and sharing social cards
 */

import { Firestore } from "firebase/firestore";
import { ShareableCardRepository } from "@/repositories/shareable-card.repository";
import { ShareableCard, ShareableCardType } from "@/domain/shareable-card/types";

export class ShareableCardService {
  private cardRepo: ShareableCardRepository;

  constructor(db: Firestore) {
    this.cardRepo = new ShareableCardRepository(db);
  }

  /**
   * Generate EcoScore card
   */
  async generateEcoScoreCard(
    userId: string,
    userName: string,
    ecoScore: number,
    level: string,
    avatarUrl?: string
  ): Promise<ShareableCard> {
    try {
      return await this.cardRepo.create({
        userId,
        type: "eco_score",
        data: {
          userId,
          userName,
          ecoScore,
          level,
          avatarUrl,
          generatedAt: Date.now(),
        },
        createdAt: Date.now(),
        stats: {
          generated: 1,
          shared: 0,
          clicked: 0,
          platforms: {},
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate EcoScore card: ${error}`);
    }
  }

  /**
   * Generate streak card
   */
  async generateStreakCard(
    userId: string,
    userName: string,
    currentStreak: number,
    bestStreak: number,
    category: string
  ): Promise<ShareableCard> {
    try {
      return await this.cardRepo.create({
        userId,
        type: "streak",
        data: {
          userId,
          userName,
          currentStreak,
          bestStreak,
          category,
          emoji: this.getEmojiForCategory(category),
          generatedAt: Date.now(),
        },
        createdAt: Date.now(),
        stats: {
          generated: 1,
          shared: 0,
          clicked: 0,
          platforms: {},
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate streak card: ${error}`);
    }
  }

  /**
   * Generate monthly report card
   */
  async generateMonthlyReportCard(
    userId: string,
    userName: string,
    month: string,
    year: number,
    ecoScore: number,
    carbonSaved: number,
    bestCategory: string,
    achievements: number,
    rank: number
  ): Promise<ShareableCard> {
    try {
      return await this.cardRepo.create({
        userId,
        type: "monthly_report",
        data: {
          userId,
          userName,
          month,
          year,
          ecoScore,
          carbonSaved,
          bestCategory,
          achievements,
          rank,
          generatedAt: Date.now(),
        },
        createdAt: Date.now(),
        stats: {
          generated: 1,
          shared: 0,
          clicked: 0,
          platforms: {},
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate monthly report card: ${error}`);
    }
  }

  /**
   * Get user's cards
   */
  async getUserCards(
    userId: string,
    type?: ShareableCardType,
    limit: number = 50
  ): Promise<ShareableCard[]> {
    try {
      return await this.cardRepo.getUserCards(userId, type, limit);
    } catch (error) {
      throw new Error(`Failed to get user cards: ${error}`);
    }
  }

  /**
   * Record share event
   */
  async recordShare(
    cardId: string,
    userId: string,
    platform: "twitter" | "facebook" | "whatsapp" | "instagram" | "email" | "link"
  ): Promise<void> {
    try {
      await this.cardRepo.recordShare(cardId, userId, platform);
    } catch (error) {
      throw new Error(`Failed to record share: ${error}`);
    }
  }

  /**
   * Record click on shared card
   */
  async recordClick(cardId: string): Promise<void> {
    try {
      await this.cardRepo.recordClick(cardId);
    } catch (error) {
      throw new Error(`Failed to record click: ${error}`);
    }
  }

  /**
   * Get card details
   */
  async getCard(cardId: string): Promise<ShareableCard | null> {
    try {
      return await this.cardRepo.getById(cardId);
    } catch (error) {
      throw new Error(`Failed to get card: ${error}`);
    }
  }

  /**
   * Generate SVG for card (would use template system)
   */
  async generateCardSVG(card: ShareableCard): Promise<string> {
    try {
      // This would use actual SVG templating library
      // For now, return placeholder
      return `<svg><!-- Card SVG for ${card.type} --></svg>`;
    } catch (error) {
      throw new Error(`Failed to generate SVG: ${error}`);
    }
  }

  /**
   * Export card as PNG (requires backend processing)
   */
  async exportCardAsPNG(cardId: string): Promise<string> {
    try {
      const card = await this.getCard(cardId);
      if (!card) {
        throw new Error("Card not found");
      }

      // Would call Cloud Function or external service to convert SVG to PNG
      // Return download URL
      return `/api/cards/${cardId}/export/png`;
    } catch (error) {
      throw new Error(`Failed to export card: ${error}`);
    }
  }

  /**
   * Get emoji for category
   */
  private getEmojiForCategory(category: string): string {
    const emojis: Record<string, string> = {
      food: "🥗",
      transport: "🚌",
      energy: "💡",
      general: "🌱",
    };
    return emojis[category] || "🌍";
  }

  /**
   * Get social media text for sharing
   */
  getSocialText(card: ShareableCard): Record<string, string> {
    const baseUrl = "https://ecoscore.app";

    const shareTexts: Record<ShareableCardType, string> = {
      eco_score: `Check out my EcoScore: ${card.data.ecoScore}! 🌱 Join me on EcoScore to track your carbon footprint. ${baseUrl}`,
      streak: `I'm on a ${card.data.currentStreak}-day streak! 🔥 Can you beat my record? Join EcoScore. ${baseUrl}`,
      monthly_report: `My ${card.data.month} EcoScore report is ready! I saved ${card.data.carbonSaved} kg of CO2. 📊 ${baseUrl}`,
      achievement: `I just unlocked a new achievement! 🎉 Join EcoScore to earn badges. ${baseUrl}`,
      challenge: `I'm participating in a community challenge! 🏆 Join me on EcoScore. ${baseUrl}`,
    };

    return {
      twitter: shareTexts[card.type],
      facebook: shareTexts[card.type],
      whatsapp: shareTexts[card.type],
      instagram: "Check out my latest sustainability milestone! #EcoScore #Sustainability",
      email: `You should check out my EcoScore report!\n\n${shareTexts[card.type]}`,
    };
  }

  /**
   * Delete card
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      await this.cardRepo.delete(cardId);
    } catch (error) {
      throw new Error(`Failed to delete card: ${error}`);
    }
  }
}
