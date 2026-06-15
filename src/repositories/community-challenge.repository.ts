/**
 * Community Challenge Repository
 * Data access layer for community-wide challenges and participation
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Firestore,
} from "firebase/firestore";
import { CommunityChallenge, ChallengeParticipant, ChallengeEntry } from "@/domain/challenge/types";
import type {
  CommunityChallengeDoc,
  ChallengeParticipantDoc,
  ChallengeEntryDoc,
} from "@/domain/firestore.schema";

export class CommunityChallengeRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create a new challenge
   */
  async create(challenge: Omit<CommunityChallenge, "id">): Promise<CommunityChallenge> {
    try {
      const docRef = await addDoc(
        collection(this.db, "community_challenges"),
        challenge as CommunityChallengeDoc
      );
      return {
        ...challenge,
        id: docRef.id,
      };
    } catch (error) {
      throw new Error(`Failed to create challenge: ${error}`);
    }
  }

  /**
   * Get challenge by ID
   */
  async getById(challengeId: string): Promise<CommunityChallenge | null> {
    try {
      const docRef = doc(this.db, "community_challenges", challengeId);
      const snapshot = await getDocs(
        query(collection(this.db, "community_challenges"), where("__name__", "==", docRef.id))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as CommunityChallengeDoc;
      return {
        ...(data as Omit<CommunityChallenge, "id">),
        id: snapshot.docs[0].id,
      };
    } catch (error) {
      throw new Error(`Failed to get challenge: ${error}`);
    }
  }

  /**
   * Get all active challenges
   */
  async getActive(type?: string): Promise<CommunityChallenge[]> {
    try {
      let q;
      const now = Date.now();

      if (type) {
        q = query(
          collection(this.db, "community_challenges"),
          where("status", "==", "active"),
          where("type", "==", type)
        );
      } else {
        q = query(collection(this.db, "community_challenges"), where("status", "==", "active"));
      }

      const snapshot = await getDocs(q);
      const challenges = snapshot.docs
        .map((doc) => {
          const data = doc.data() as CommunityChallengeDoc;
          return {
            ...(data as Omit<CommunityChallenge, "id">),
            id: doc.id,
          };
        })
        .filter((c) => c.startDate <= now && c.endDate >= now);

      return challenges;
    } catch (error) {
      throw new Error(`Failed to get active challenges: ${error}`);
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    try {
      const docRef = await addDoc(
        collection(this.db, `community_challenges/${challengeId}/participants`),
        {
          challengeId,
          userId,
          joinedAt: Date.now(),
          progress: 0,
          rank: undefined,
        } as ChallengeParticipantDoc
      );

      // Increment participant count on challenge
      const challengeRef = doc(this.db, "community_challenges", challengeId);
      const challenge = await this.getById(challengeId);
      if (challenge) {
        await updateDoc(challengeRef, {
          participants: challenge.participants + 1,
        });
      }

      return {
        id: docRef.id,
        challengeId,
        userId,
        joinedAt: Date.now(),
        progress: 0,
        entries: [],
      };
    } catch (error) {
      throw new Error(`Failed to join challenge: ${error}`);
    }
  }

  /**
   * Log activity for challenge
   */
  async logEntry(
    challengeId: string,
    userId: string,
    activityId: string,
    value: number
  ): Promise<ChallengeEntry> {
    try {
      // Get participant first to update progress
      const participantSnap = await getDocs(
        query(
          collection(this.db, `community_challenges/${challengeId}/participants`),
          where("userId", "==", userId)
        )
      );

      if (participantSnap.empty) {
        throw new Error("User is not a participant in this challenge");
      }

      // Add entry
      const docRef = await addDoc(
        collection(this.db, `community_challenges/${challengeId}/entries`),
        {
          challengeId,
          userId,
          activityId,
          loggedAt: Date.now(),
          value,
        } as ChallengeEntryDoc
      );

      // Update participant progress
      const participantRef = participantSnap.docs[0].ref;
      const participantData = participantSnap.docs[0].data() as ChallengeParticipantDoc;
      await updateDoc(participantRef, {
        progress: (participantData.progress || 0) + value,
      });

      return {
        id: docRef.id,
        challengeId,
        userId,
        activityId,
        loggedAt: Date.now(),
        value,
      };
    } catch (error) {
      throw new Error(`Failed to log entry: ${error}`);
    }
  }

  /**
   * Get user's participation in a challenge
   */
  async getUserParticipation(
    challengeId: string,
    userId: string
  ): Promise<ChallengeParticipant | null> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, `community_challenges/${challengeId}/participants`),
          where("userId", "==", userId)
        )
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as ChallengeParticipantDoc;
      const entries = await getDocs(
        query(
          collection(this.db, `community_challenges/${challengeId}/entries`),
          where("userId", "==", userId)
        )
      );

      return {
        id: snapshot.docs[0].id,
        challengeId: data.challengeId,
        userId: data.userId,
        joinedAt: data.joinedAt,
        progress: data.progress,
        completedAt: data.completedAt,
        entries: entries.docs.map((doc) => {
          const entryData = doc.data() as ChallengeEntryDoc;
          return {
            id: doc.id,
            ...entryData,
          };
        }),
      };
    } catch (error) {
      throw new Error(`Failed to get user participation: ${error}`);
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getLeaderboard(
    challengeId: string,
    limit: number = 100
  ): Promise<
    { rank: number; userId: string; userName: string; progress: number; entries: number }[]
  > {
    try {
      const participants = await getDocs(
        query(collection(this.db, `community_challenges/${challengeId}/participants`))
      );

      const entries = await getDocs(
        query(collection(this.db, `community_challenges/${challengeId}/entries`))
      );

      // Build leaderboard
      const leaderboard = participants.docs
        .map((doc, idx) => {
          const data = doc.data() as ChallengeParticipantDoc;
          const userEntries = entries.docs.filter(
            (e) => (e.data() as ChallengeEntryDoc).userId === data.userId
          ).length;

          return {
            rank: idx + 1,
            userId: data.userId,
            userName: `User ${data.userId.slice(0, 8)}`, // Placeholder
            progress: data.progress,
            entries: userEntries,
          };
        })
        .sort((a, b) => b.progress - a.progress)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

      return leaderboard.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get leaderboard: ${error}`);
    }
  }

  /**
   * Complete a challenge for user
   */
  async completeChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, `community_challenges/${challengeId}/participants`),
          where("userId", "==", userId)
        )
      );

      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          completedAt: Date.now(),
        });
      }
    } catch (error) {
      throw new Error(`Failed to complete challenge: ${error}`);
    }
  }
}
