/**
 * Shareable Cards Domain Types
 * Represents exportable social media cards
 */

export type ShareableCardType =
  | "eco_score"
  | "streak"
  | "monthly_report"
  | "achievement"
  | "challenge";

export interface ShareableCard {
  id: string;
  userId: string;
  type: ShareableCardType;
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt?: number;
  stats: ShareCardStats;
}

export interface ShareCardStats {
  generated: number;
  shared: number;
  clicked: number;
  platforms: {
    twitter?: number;
    facebook?: number;
    whatsapp?: number;
    instagram?: number;
    email?: number;
    link?: number;
  };
}

export interface EcoScoreCard {
  userId: string;
  userName: string;
  ecoScore: number;
  level: string;
  avatarUrl?: string;
  generatedAt: number;
}

export interface StreakCard {
  userId: string;
  userName: string;
  currentStreak: number;
  bestStreak: number;
  category: string;
  emoji: string;
  generatedAt: number;
}

export interface MonthlyReportCardShare {
  userId: string;
  userName: string;
  month: string;
  year: number;
  ecoScore: number;
  carbonSaved: number;
  bestCategory: string;
  achievements: number;
  rank: number;
  generatedAt: number;
}

export interface CardExportFormat {
  format: "png" | "svg" | "jpeg";
  width: number;
  height: number;
  quality?: number;
  transparent: boolean;
}

export interface CardTemplate {
  id: string;
  name: string;
  type: ShareableCardType;
  svgTemplate: string; // SVG with placeholders for data
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts: {
    title: string;
    body: string;
  };
}

export interface ShareEvent {
  id: string;
  cardId: string;
  userId: string;
  platform: "twitter" | "facebook" | "whatsapp" | "instagram" | "email" | "link";
  sharedAt: number;
  clickedAt?: number;
  campaignId?: string; // For analytics
}
