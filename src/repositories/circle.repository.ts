/**
 * Friend Circle Repository
 * Data access layer for friend circles and memberships
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Firestore,
} from "firebase/firestore";
import { Circle, CircleMember, CircleInvite } from "@/domain/friend-circle/types";
import type { CircleDoc, CircleMemberDoc, CircleInviteDoc } from "@/domain/firestore.schema";

export class CircleRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create a new circle
   */
  async create(
    name: string,
    description: string,
    ownerId: string,
    visibility: "private" | "friends_only" | "public" = "private"
  ): Promise<Circle> {
    try {
      const docRef = await addDoc(collection(this.db, "circles"), {
        name,
        description,
        ownerId,
        visibility,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stats: {
          totalMembers: 1,
          totalEcoScore: 0,
          averageEcoScore: 0,
          weeklyProgress: 0,
          activeMembers: 1,
        },
      } as CircleDoc);

      // Add owner as first member
      await this.addMember(docRef.id, ownerId, "admin");

      return {
        id: docRef.id,
        name,
        description,
        ownerId,
        members: [
          {
            userId: ownerId,
            role: "owner",
            joinedAt: Date.now(),
            lastActivity: Date.now(),
            contribution: 0,
          },
        ],
        visibility,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stats: {
          totalMembers: 1,
          totalEcoScore: 0,
          averageEcoScore: 0,
          weeklyProgress: 0,
          activeMembers: 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to create circle: ${error}`);
    }
  }

  /**
   * Get circle by ID
   */
  async getById(circleId: string): Promise<Circle | null> {
    try {
      const docRef = doc(this.db, "circles", circleId);
      const snapshot = await getDocs(
        query(collection(this.db, "circles"), where("__name__", "==", docRef.id))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as CircleDoc;
      const members = await this.getMembers(circleId);

      return {
        id: snapshot.docs[0].id,
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        members,
        visibility: data.visibility,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        stats: data.stats,
      };
    } catch (error) {
      throw new Error(`Failed to get circle: ${error}`);
    }
  }

  /**
   * Get all circles for a user
   */
  async getUserCircles(userId: string): Promise<Circle[]> {
    try {
      // Get all circles where user is a member
      // Note: Firestore doesn't have direct array filtering, so we'll query then filter in app
      const circlesRef = collection(this.db, "circles");
      const allCircles = await getDocs(circlesRef);

      const userCircles: Circle[] = [];

      for (const doc of allCircles.docs) {
        const members = await this.getMembers(doc.id);
        const isMember = members.some((m) => m.userId === userId);

        if (isMember) {
          const data = doc.data() as CircleDoc;
          userCircles.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            ownerId: data.ownerId,
            members,
            visibility: data.visibility,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            stats: data.stats,
          });
        }
      }

      return userCircles;
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
      await addDoc(collection(this.db, `circles/${circleId}/members`), {
        userId,
        role,
        joinedAt: Date.now(),
        lastActivity: Date.now(),
        contribution: 0,
        status: "active",
      } as CircleMemberDoc);

      // Update circle stats
      const docRef = doc(this.db, "circles", circleId);
      const circle = await this.getById(circleId);
      if (circle) {
        await updateDoc(docRef, {
          "stats.totalMembers": circle.members.length + 1,
          "stats.activeMembers": circle.stats.activeMembers + 1,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      throw new Error(`Failed to add member to circle: ${error}`);
    }
  }

  /**
   * Get all members of a circle
   */
  async getMembers(circleId: string): Promise<CircleMember[]> {
    try {
      const snapshot = await getDocs(collection(this.db, `circles/${circleId}/members`));

      return snapshot.docs.map((doc) => {
        const data = doc.data() as CircleMemberDoc;
        return {
          userId: data.userId,
          role: data.role,
          joinedAt: data.joinedAt,
          lastActivity: data.lastActivity,
          contribution: data.contribution,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get circle members: ${error}`);
    }
  }

  /**
   * Remove member from circle
   */
  async removeMember(circleId: string, userId: string): Promise<void> {
    try {
      const membersSnap = await getDocs(
        query(collection(this.db, `circles/${circleId}/members`), where("userId", "==", userId))
      );

      if (!membersSnap.empty) {
        await deleteDoc(membersSnap.docs[0].ref);

        // Update circle stats
        const docRef = doc(this.db, "circles", circleId);
        const circle = await this.getById(circleId);
        if (circle) {
          await updateDoc(docRef, {
            "stats.totalMembers": Math.max(0, circle.members.length - 1),
            updatedAt: Date.now(),
          });
        }
      }
    } catch (error) {
      throw new Error(`Failed to remove member from circle: ${error}`);
    }
  }

  /**
   * Send circle invite
   */
  async sendInvite(
    circleId: string,
    invitedBy: string,
    invitedEmail: string,
    expiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<CircleInvite> {
    try {
      const docRef = await addDoc(collection(this.db, `circles/${circleId}/invites`), {
        circleId,
        invitedBy,
        invitedEmail,
        invitedAt: Date.now(),
        expiresAt: Date.now() + expiresIn,
        status: "pending",
      } as CircleInviteDoc);

      return {
        id: docRef.id,
        circleId,
        invitedBy,
        invitedEmail,
        invitedAt: Date.now(),
        expiresAt: Date.now() + expiresIn,
        status: "pending",
      };
    } catch (error) {
      throw new Error(`Failed to send invite: ${error}`);
    }
  }

  /**
   * Accept circle invite
   */
  async acceptInvite(circleId: string, inviteId: string, userId: string): Promise<void> {
    try {
      // Update invite status
      const inviteRef = doc(this.db, `circles/${circleId}/invites`, inviteId);
      await updateDoc(inviteRef, { status: "accepted" });

      // Add user to circle
      await this.addMember(circleId, userId, "member");
    } catch (error) {
      throw new Error(`Failed to accept invite: ${error}`);
    }
  }

  /**
   * Update circle stats
   */
  async updateStats(circleId: string, stats: Partial<Record<string, unknown>>): Promise<void> {
    try {
      const docRef = doc(this.db, "circles", circleId);
      await updateDoc(docRef, {
        stats: stats,
        updatedAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to update circle stats: ${error}`);
    }
  }
}
