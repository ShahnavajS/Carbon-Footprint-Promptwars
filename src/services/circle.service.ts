/**
 * Friend Circle Service
 * Business logic for friend circles and group engagement
 */

import { Firestore } from "firebase/firestore";
import { CircleRepository } from "@/repositories/circle.repository";
import { Circle, CircleMember, CircleWeeklyRanking } from "@/domain/friend-circle/types";

export class CircleService {
  private circleRepo: CircleRepository;

  constructor(db: Firestore) {
    this.circleRepo = new CircleRepository(db);
  }

  /**
   * Create a new circle
   */
  async createCircle(
    name: string,
    description: string,
    ownerId: string,
    visibility: "private" | "friends_only" | "public" = "private"
  ): Promise<Circle> {
    try {
      return await this.circleRepo.create(name, description, ownerId, visibility);
    } catch (error) {
      throw new Error(`Failed to create circle: ${error}`);
    }
  }

  /**
   * Get circle details
   */
  async getCircle(circleId: string): Promise<Circle | null> {
    try {
      return await this.circleRepo.getById(circleId);
    } catch (error) {
      throw new Error(`Failed to get circle: ${error}`);
    }
  }

  /**
   * Get all circles for user
   */
  async getUserCircles(userId: string): Promise<Circle[]> {
    try {
      return await this.circleRepo.getUserCircles(userId);
    } catch (error) {
      throw new Error(`Failed to get user circles: ${error}`);
    }
  }

  /**
   * Add member to circle
   */
  async addMember(
    circleId: string,
    userId: string,
    role: "admin" | "member" = "member"
  ): Promise<void> {
    try {
      await this.circleRepo.addMember(circleId, userId, role);
    } catch (error) {
      throw new Error(`Failed to add member: ${error}`);
    }
  }

  /**
   * Remove member from circle
   */
  async removeMember(circleId: string, userId: string): Promise<void> {
    try {
      await this.circleRepo.removeMember(circleId, userId);
    } catch (error) {
      throw new Error(`Failed to remove member: ${error}`);
    }
  }

  /**
   * Send invite to join circle
   */
  async inviteMember(
    circleId: string,
    invitedBy: string,
    invitedEmail: string,
    expiresIn?: number
  ): Promise<string> {
    try {
      const invite = await this.circleRepo.sendInvite(circleId, invitedBy, invitedEmail, expiresIn);
      return invite.id;
    } catch (error) {
      throw new Error(`Failed to send invite: ${error}`);
    }
  }

  /**
   * Accept circle invite
   */
  async acceptInvite(circleId: string, inviteId: string, userId: string): Promise<void> {
    try {
      await this.circleRepo.acceptInvite(circleId, inviteId, userId);
    } catch (error) {
      throw new Error(`Failed to accept invite: ${error}`);
    }
  }

  /**
   * Get circle members
   */
  async getMembers(circleId: string): Promise<CircleMember[]> {
    try {
      return await this.circleRepo.getMembers(circleId);
    } catch (error) {
      throw new Error(`Failed to get members: ${error}`);
    }
  }

  /**
   * Calculate weekly rankings for circle
   */
  async generateWeeklyRanking(circleId: string): Promise<CircleWeeklyRanking> {
    try {
      const circle = await this.circleRepo.getById(circleId);
      if (!circle) {
        throw new Error("Circle not found");
      }

      const members = await this.circleRepo.getMembers(circleId);

      // Calculate rankings (would get actual eco scores from user profile)
      const rankings = members
        .map((m, idx) => ({
          userId: m.userId,
          rank: idx + 1,
          ecoScore: m.contribution, // Placeholder
          activities: 0,
          change: 0,
        }))
        .sort((a, b) => b.ecoScore - a.ecoScore)
        .map((r, idx) => ({ ...r, rank: idx + 1 }));

      const now = new Date();
      const weekStart = now.getDate() - now.getDay();
      const week = Math.ceil((now.getDate() - weekStart) / 7);

      return {
        circleId,
        week,
        year: now.getFullYear(),
        rankings,
        topAchievements: [],
        generatedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to generate weekly ranking: ${error}`);
    }
  }

  /**
   * Update circle member contribution
   */
  async updateMemberContribution(
    circleId: string,
    userId: string,
    ecoPointsAdded: number
  ): Promise<void> {
    try {
      const members = await this.circleRepo.getMembers(circleId);
      const member = members.find((m) => m.userId === userId);

      if (!member) {
        throw new Error("Member not found");
      }

      const newContribution = member.contribution + ecoPointsAdded;
      const totalEcoScore = members.reduce((sum, m) => sum + m.contribution, newContribution);

      await this.circleRepo.updateStats(circleId, {
        totalEcoScore,
        averageEcoScore: totalEcoScore / members.length,
      });
    } catch (error) {
      throw new Error(`Failed to update member contribution: ${error}`);
    }
  }

  /**
   * Validate circle membership
   */
  async isMember(circleId: string, userId: string): Promise<boolean> {
    try {
      const members = await this.circleRepo.getMembers(circleId);
      return members.some((m) => m.userId === userId);
    } catch (error) {
      throw new Error(`Failed to validate membership: ${error}`);
    }
  }

  /**
   * Get circle member role
   */
  async getMemberRole(
    circleId: string,
    userId: string
  ): Promise<"owner" | "admin" | "member" | null> {
    try {
      const members = await this.circleRepo.getMembers(circleId);
      const member = members.find((m) => m.userId === userId);
      return member?.role || null;
    } catch (error) {
      throw new Error(`Failed to get member role: ${error}`);
    }
  }
}
