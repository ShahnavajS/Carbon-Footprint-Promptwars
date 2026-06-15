/**
 * Report Card Repository
 * Data access layer for monthly report cards
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
  QueryConstraint,
} from "firebase/firestore";
import { MonthlyReportCard } from "@/domain/report-card/types";
import type { MonthlyReportCardDoc } from "@/domain/firestore.schema";

export class ReportCardRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create a new monthly report card
   */
  async create(card: Omit<MonthlyReportCard, "id">): Promise<MonthlyReportCard> {
    try {
      const docRef = await addDoc(
        collection(this.db, "monthly_report_cards"),
        card as MonthlyReportCardDoc
      );
      return {
        ...card,
        id: docRef.id,
      };
    } catch (error) {
      throw new Error(`Failed to create report card: ${error}`);
    }
  }

  /**
   * Get report card by ID
   */
  async getById(reportId: string): Promise<MonthlyReportCard | null> {
    try {
      const docRef = doc(this.db, "monthly_report_cards", reportId);
      const snapshot = await getDocs(
        query(collection(this.db, "monthly_report_cards"), where("__name__", "==", docRef.id))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as MonthlyReportCardDoc;
      return {
        ...(data as Omit<MonthlyReportCard, "id">),
        id: snapshot.docs[0].id,
      };
    } catch (error) {
      throw new Error(`Failed to get report card: ${error}`);
    }
  }

  /**
   * Get latest report card for user in specific month
   */
  async getLatestByMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyReportCard | null> {
    try {
      const constraints: QueryConstraint[] = [
        where("userId", "==", userId),
        where("year", "==", year),
        where("month", "==", month),
      ];

      const q = query(collection(this.db, "monthly_report_cards"), ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as MonthlyReportCardDoc;
      return {
        ...(data as Omit<MonthlyReportCard, "id">),
        id: snapshot.docs[0].id,
      };
    } catch (error) {
      throw new Error(`Failed to get latest report card: ${error}`);
    }
  }

  /**
   * Get all report cards for a user with pagination
   */
  async getUserReports(
    userId: string,
    limit: number = 12,
    offset: number = 0
  ): Promise<MonthlyReportCard[]> {
    try {
      const q = query(collection(this.db, "monthly_report_cards"), where("userId", "==", userId));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .sort((a, b) => {
          const aData = a.data() as MonthlyReportCardDoc;
          const bData = b.data() as MonthlyReportCardDoc;
          return bData.generatedAt - aData.generatedAt; // Most recent first
        })
        .slice(offset, offset + limit)
        .map((doc) => {
          const data = doc.data() as MonthlyReportCardDoc;
          return {
            ...(data as Omit<MonthlyReportCard, "id">),
            id: doc.id,
          };
        });
    } catch (error) {
      throw new Error(`Failed to get user reports: ${error}`);
    }
  }

  /**
   * Update report card view
   */
  async markAsViewed(reportId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "monthly_report_cards", reportId);
      await updateDoc(docRef, {
        viewedAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to mark report as viewed: ${error}`);
    }
  }

  /**
   * Track share event
   */
  async recordShare(reportId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "monthly_report_cards", reportId);
      const snapshot = await getDocs(
        query(collection(this.db, "monthly_report_cards"), where("__name__", "==", docRef.id))
      );

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as MonthlyReportCardDoc;
        await updateDoc(snapshot.docs[0].ref, {
          sharedAt: Date.now(),
          shareCount: (data.shareCount || 0) + 1,
        });
      }
    } catch (error) {
      throw new Error(`Failed to record share: ${error}`);
    }
  }

  /**
   * Delete report card
   */
  async delete(reportId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "monthly_report_cards", reportId);
      await updateDoc(docRef, {
        deletedAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to delete report card: ${error}`);
    }
  }
}
