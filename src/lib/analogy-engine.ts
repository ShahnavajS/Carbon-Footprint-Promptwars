/**
 * Tangible Analogy Engine for carbon emissions.
 * Converts abstract carbon metrics (kg CO₂) into physical, relatable,
 * and memorable real-world comparisons.
 */

export interface CarbonAnalogy {
  type: "phone" | "tree" | "balloon" | "fan" | "car";
  value: number;
  text: string;
}

export const AnalogyEngine = {
  /**
   * Calculates the equivalent number of smartphone charges.
   * Assumes 1 smartphone charge ≈ 0.01 kWh.
   * At 0.4 kg CO₂ per kWh, 1 charge ≈ 0.004 kg CO₂.
   * Thus, 1 kg CO₂ ≈ 250 charges.
   */
  getPhoneCharges(kg: number): number {
    return Math.max(1, Math.round(kg * 250));
  },

  /**
   * Calculates the equivalent number of tree absorption days.
   * Assumes a mature tree absorbs ≈ 22 kg CO₂/year (≈ 0.06 kg CO₂/day).
   * Thus, 1 kg CO₂ ≈ 16.7 tree-days.
   */
  getTreeDays(kg: number): number {
    return Math.max(1, Math.round(kg * 16.7));
  },

  /**
   * Calculates the volume of CO₂ gas in terms of standard latex party balloons.
   * Assumes 1 kg of CO₂ gas occupies ≈ 550 liters at room temp.
   * A standard 30cm latex party balloon holds ≈ 14 liters.
   * Thus, 1 kg CO₂ ≈ 39 balloons.
   */
  getBalloons(kg: number): number {
    return Math.max(1, Math.round(kg * 39));
  },

  /**
   * Calculates equivalent running hours for a typical household fan (50W).
   * At 0.4 kg CO₂ per kWh, a 50W fan running for 1 hour (0.05 kWh) ≈ 0.02 kg CO₂.
   * Thus, 1 kg CO₂ ≈ 50 hours.
   */
  getFanHours(kg: number): number {
    return Math.max(1, Math.round(kg * 50));
  },

  /**
   * Calculates equivalent driving distance avoided in a standard passenger car.
   * Assumes average emissions of 0.2 kg CO₂ per kilometer.
   * Thus, 1 kg CO₂ ≈ 5 kilometers.
   */
  getCarKilometers(kg: number): number {
    return Math.max(1, Math.round(kg * 5));
  },

  /**
   * Generates a single, highly visual comparison string for a given carbon value.
   */
  getPrimaryAnalogyText(kg: number): string {
    if (kg <= 0) return "sparing the atmosphere from raw carbon emissions.";

    const treeDays = this.getTreeDays(kg);
    if (kg < 0.5) {
      const charges = this.getPhoneCharges(kg);
      return `enough to charge a smartphone ${charges} times.`;
    }
    if (kg < 2.0) {
      const balloons = this.getBalloons(kg);
      return `preventing a cloud of pure greenhouse gas the volume of ${balloons} party balloons from entering our sky.`;
    }
    if (kg < 10) {
      const fanHours = this.getFanHours(kg);
      return `equivalent to the carbon absorbed by a mature tree in ${treeDays} days, or running a household fan for ${fanHours} hours.`;
    }

    const carKm = this.getCarKilometers(kg);
    const yearsTree = (treeDays / 365).toFixed(1);
    return `equal to a tree absorbing carbon for ${treeDays} days (${yearsTree} years), or avoiding driving a typical petrol car for ${carKm} kilometers.`;
  },

  /**
   * Returns a complete set of analogies for detailed cards/displays.
   */
  getAnalogyBreakdown(kg: number): CarbonAnalogy[] {
    return [
      {
        type: "phone",
        value: this.getPhoneCharges(kg),
        text: `Charge a smartphone ${this.getPhoneCharges(kg)} times`,
      },
      {
        type: "tree",
        value: this.getTreeDays(kg),
        text: `Equates to ${this.getTreeDays(kg)} days of a mature tree breathing in carbon`,
      },
      {
        type: "balloon",
        value: this.getBalloons(kg),
        text: `Keeps ${this.getBalloons(kg)} party balloons of pure CO₂ gas out of the atmosphere`,
      },
      {
        type: "fan",
        value: this.getFanHours(kg),
        text: `Power a household ceiling fan for ${this.getFanHours(kg)} hours`,
      },
      {
        type: "car",
        value: this.getCarKilometers(kg),
        text: `Avoids the emissions of driving a standard car for ${this.getCarKilometers(kg)} km`,
      },
    ];
  },
};

export default AnalogyEngine;
