/**
 * Impact Forecast Repository
 * Handles CRUD operations for forecasts
 */

import { getFirestore, collection, doc, getDoc, setDoc, getDocs } from "firebase/firestore";
import { ImpactForecast } from "@/domain/forecast/types";
import { ImpactForecastSchema } from "@/domain/forecast/schemas";
import { logger } from "@/services/logger.service";

export class ForecastRepository {
  private db = getFirestore();
  private collection_name = "forecasts";

  /**
   * Get latest forecast for user and period
   */
  async getForecast(
    userId: string,
    period: "30d" | "90d" | "180d"
  ): Promise<ImpactForecast | null> {
    try {
      const docRef = doc(this.db, "users", userId, this.collection_name, period);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const validated = ImpactForecastSchema.parse(data);
      return validated;
    } catch (error) {
      logger.error("Failed to get forecast", {
        userId,
        period,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all forecasts for user
   */
  async getForecasts(userId: string): Promise<ImpactForecast[]> {
    try {
      const querySnap = await getDocs(collection(this.db, "users", userId, this.collection_name));

      const forecasts: ImpactForecast[] = [];
      for (const docSnap of querySnap.docs) {
        try {
          const data = docSnap.data();
          const validated = ImpactForecastSchema.parse(data);
          forecasts.push(validated);
        } catch (error) {
          logger.warn("Invalid forecast document", {
            userId,
            docId: docSnap.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return forecasts;
    } catch (error) {
      logger.error("Failed to get forecasts", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Save forecast
   */
  async saveForecast(userId: string, forecast: ImpactForecast): Promise<void> {
    try {
      const validated = ImpactForecastSchema.parse(forecast);

      const docRef = doc(this.db, "users", userId, this.collection_name, forecast.period);
      await setDoc(docRef, validated);

      logger.info("Forecast saved", {
        userId,
        period: forecast.period,
        confidence: forecast.confidence,
      });
    } catch (error) {
      logger.error("Failed to save forecast", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if forecast needs regeneration
   */
  async needsRegeneration(userId: string, period: "30d" | "90d" | "180d"): Promise<boolean> {
    try {
      const forecast = await this.getForecast(userId, period);
      if (!forecast) {
        return true;
      }

      // Regenerate weekly
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - forecast.generatedAt > weekInMs;
    } catch (error) {
      logger.error("Failed to check forecast regeneration", {
        userId,
        period,
        error: error instanceof Error ? error.message : String(error),
      });
      return true;
    }
  }
}

export const forecastRepository = new ForecastRepository();
