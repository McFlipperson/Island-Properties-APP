import { db } from './db/index';
import { proxyAssignments, expertPersonas } from '../shared/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

// Cost management constants
const COST_LIMITS = {
  MAX_MONTHLY_BUDGET: 6.35, // USD per expert
  MAX_DAILY_BUDGET: 0.25, // USD per expert (roughly monthly/30)
  WARNING_THRESHOLD: 0.8, // 80% of budget
  CRITICAL_THRESHOLD: 0.95, // 95% of budget
  OVERAGE_THRESHOLD: 1.0, // 100% of budget
};

// Types for cost management
export interface CostSummary {
  expertId: string;
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    totalCost: number;
    dailyAverage: number;
    projectedMonthlyCost: number;
  };
  budgetStatus: {
    monthlyLimit: number;
    remainingBudget: number;
    percentUsed: number;
    daysRemaining: number;
    projectedOverage: number;
  };
  costBreakdown: {
    proxyCount: number;
    averageCostPerProxy: number;
    highestCostProxy: number;
    lowestCostProxy: number;
  };
  alerts: CostAlert[];
}

export interface CostAlert {
  id: string;
  type: 'warning' | 'critical' | 'overage' | 'projection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  expertId: string;
  currentSpend: number;
  threshold: number;
  recommendedAction: string;
  timestamp: Date;
}

export interface ExpertCostHistory {
  expertId: string;
  dailyCosts: DailyCostEntry[];
  monthlyTotals: MonthlyCostEntry[];
  trends: {
    averageDailyCost: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
    projectedMonthlySpend: number;
    efficiencyScore: number; // Cost per successful connection
  };
}

export interface DailyCostEntry {
  date: Date;
  totalCost: number;
  proxyCount: number;
  averageCostPerProxy: number;
}

export interface MonthlyCostEntry {
  month: string; // YYYY-MM format
  totalCost: number;
  proxyCount: number;
  budgetUtilization: number;
}

export interface SystemCostOverview {
  totalExperts: number;
  totalMonthlyCost: number;
  budgetUtilization: number;
  expertsOverBudget: number;
  expertsBelowWarningThreshold: number;
  averageCostPerExpert: number;
  projectedSystemCost: number;
  costEfficiencyMetrics: {
    averageResponseTime: number;
    costPerSuccessfulConnection: number;
    totalConnections: number;
  };
}

// Cost calculation utilities
class CostCalculator {
  /**
   * Calculate current month cost for expert
   */
  static async calculateCurrentMonthCost(expertId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const assignments = await db
      .select()
      .from(proxyAssignments)
      .where(and(
        eq(proxyAssignments.personaId, expertId),
        gte(proxyAssignments.costTrackingStartDate, monthStart),
        lte(proxyAssignments.costTrackingStartDate, monthEnd)
      ));

    return assignments.reduce((total, assignment) => {
      const monthlyCost = parseFloat(assignment.monthlyCostUsd?.toString() || '0');
      const dailyCost = parseFloat(assignment.dailyCostUsd?.toString() || '0');
      
      // Calculate prorated cost based on days active this month
      const startDate = assignment.costTrackingStartDate || assignment.createdAt || now;
      const daysActive = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const proratedCost = Math.min(dailyCost * daysActive, monthlyCost);
      
      return total + proratedCost;
    }, 0);
  }

  /**
   * Project monthly cost based on current spending
   */
  static calculateProjectedMonthlyCost(currentCost: number, daysElapsed: number): number {
    if (daysElapsed === 0) return 0;
    
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = currentCost / daysElapsed;
    
    return dailyAverage * daysInMonth;
  }

  /**
   * Calculate cost efficiency metrics
   */
  static calculateEfficiencyScore(totalCost: number, successfulConnections: number): number {
    if (successfulConnections === 0) return 0;
    return totalCost / successfulConnections;
  }

  /**
   * Determine cost trend from historical data
   */
  static analyzeCostTrend(dailyCosts: DailyCostEntry[]): 'increasing' | 'decreasing' | 'stable' {
    if (dailyCosts.length < 3) return 'stable';
    
    const recent = dailyCosts.slice(-7); // Last 7 days
    const older = dailyCosts.slice(-14, -7); // Previous 7 days
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.totalCost, 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((sum, entry) => sum + entry.totalCost, 0) / older.length : recentAvg;
    
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }
}

// Alert generation for cost management
class CostAlertManager {
  /**
   * Generate cost alerts based on spending patterns
   */
  static generateCostAlerts(expertId: string, costSummary: CostSummary): CostAlert[] {
    const alerts: CostAlert[] = [];
    const { currentPeriod, budgetStatus } = costSummary;

    // Budget threshold alerts
    if (budgetStatus.percentUsed >= COST_LIMITS.CRITICAL_THRESHOLD * 100) {
      alerts.push({
        id: `cost_critical_${expertId}_${Date.now()}`,
        type: 'critical',
        severity: 'critical',
        message: `Critical: ${budgetStatus.percentUsed.toFixed(1)}% of monthly budget used`,
        expertId,
        currentSpend: currentPeriod.totalCost,
        threshold: COST_LIMITS.MAX_MONTHLY_BUDGET * COST_LIMITS.CRITICAL_THRESHOLD,
        recommendedAction: 'Consider reducing proxy usage or contact support for budget increase',
        timestamp: new Date()
      });
    } else if (budgetStatus.percentUsed >= COST_LIMITS.WARNING_THRESHOLD * 100) {
      alerts.push({
        id: `cost_warning_${expertId}_${Date.now()}`,
        type: 'warning',
        severity: 'medium',
        message: `Warning: ${budgetStatus.percentUsed.toFixed(1)}% of monthly budget used`,
        expertId,
        currentSpend: currentPeriod.totalCost,
        threshold: COST_LIMITS.MAX_MONTHLY_BUDGET * COST_LIMITS.WARNING_THRESHOLD,
        recommendedAction: 'Monitor usage closely to avoid exceeding budget',
        timestamp: new Date()
      });
    }

    // Overage alerts
    if (budgetStatus.percentUsed >= 100) {
      alerts.push({
        id: `cost_overage_${expertId}_${Date.now()}`,
        type: 'overage',
        severity: 'critical',
        message: `Budget exceeded by $${budgetStatus.projectedOverage.toFixed(2)}`,
        expertId,
        currentSpend: currentPeriod.totalCost,
        threshold: COST_LIMITS.MAX_MONTHLY_BUDGET,
        recommendedAction: 'Immediate action required: Reduce proxy usage or request budget increase',
        timestamp: new Date()
      });
    }

    // Projection alerts
    if (budgetStatus.projectedOverage > 0) {
      alerts.push({
        id: `cost_projection_${expertId}_${Date.now()}`,
        type: 'projection',
        severity: 'high',
        message: `Projected overage of $${budgetStatus.projectedOverage.toFixed(2)} this month`,
        expertId,
        currentSpend: currentPeriod.totalCost,
        threshold: COST_LIMITS.MAX_MONTHLY_BUDGET,
        recommendedAction: 'Adjust proxy usage to stay within budget',
        timestamp: new Date()
      });
    }

    return alerts;
  }
}

// Main Cost Management Service
export class CostManagementService {
  /**
   * Get comprehensive cost summary for expert
   */
  async getExpertCostSummary(expertId: string): Promise<CostSummary> {
    // Calculate current period costs
    const currentCost = await CostCalculator.calculateCurrentMonthCost(expertId);
    
    // Get current period dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysElapsed = Math.ceil((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate projections
    const dailyAverage = daysElapsed > 0 ? currentCost / daysElapsed : 0;
    const projectedMonthlyCost = CostCalculator.calculateProjectedMonthlyCost(currentCost, daysElapsed);
    
    // Budget calculations
    const percentUsed = (currentCost / COST_LIMITS.MAX_MONTHLY_BUDGET) * 100;
    const remainingBudget = Math.max(0, COST_LIMITS.MAX_MONTHLY_BUDGET - currentCost);
    const projectedOverage = Math.max(0, projectedMonthlyCost - COST_LIMITS.MAX_MONTHLY_BUDGET);
    
    // Get proxy cost breakdown
    const activeAssignments = await db
      .select()
      .from(proxyAssignments)
      .where(and(
        eq(proxyAssignments.personaId, expertId),
        eq(proxyAssignments.assignmentStatus, 'active')
      ));
    
    const proxyCosts = activeAssignments.map(a => parseFloat(a.monthlyCostUsd?.toString() || '0'));
    const costBreakdown = {
      proxyCount: activeAssignments.length,
      averageCostPerProxy: proxyCosts.length > 0 ? proxyCosts.reduce((sum, cost) => sum + cost, 0) / proxyCosts.length : 0,
      highestCostProxy: proxyCosts.length > 0 ? Math.max(...proxyCosts) : 0,
      lowestCostProxy: proxyCosts.length > 0 ? Math.min(...proxyCosts) : 0
    };

    const costSummary: CostSummary = {
      expertId,
      currentPeriod: {
        startDate: monthStart,
        endDate: monthEnd,
        totalCost: currentCost,
        dailyAverage,
        projectedMonthlyCost
      },
      budgetStatus: {
        monthlyLimit: COST_LIMITS.MAX_MONTHLY_BUDGET,
        remainingBudget,
        percentUsed,
        daysRemaining,
        projectedOverage
      },
      costBreakdown,
      alerts: []
    };

    // Generate alerts
    costSummary.alerts = CostAlertManager.generateCostAlerts(expertId, costSummary);

    return costSummary;
  }

  /**
   * Get expert cost history and trends
   */
  async getExpertCostHistory(expertId: string, months: number = 6): Promise<ExpertCostHistory> {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months, 1);

    // Get all assignments in the period
    const assignments = await db
      .select()
      .from(proxyAssignments)
      .where(and(
        eq(proxyAssignments.personaId, expertId),
        gte(proxyAssignments.createdAt, startDate)
      ))
      .orderBy(asc(proxyAssignments.createdAt));

    // Build daily cost entries
    const dailyCosts = this.buildDailyCostEntries(assignments, startDate, endDate);
    
    // Build monthly totals
    const monthlyTotals = this.buildMonthlyCostEntries(dailyCosts);
    
    // Analyze trends
    const averageDailyCost = dailyCosts.length > 0 ? 
      dailyCosts.reduce((sum, entry) => sum + entry.totalCost, 0) / dailyCosts.length : 0;
    
    const costTrend = CostCalculator.analyzeCostTrend(dailyCosts);
    
    const projectedMonthlySpend = CostCalculator.calculateProjectedMonthlyCost(
      averageDailyCost * new Date().getDate(),
      new Date().getDate()
    );

    // Calculate efficiency score (cost per successful connection)
    const totalCost = dailyCosts.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalConnections = assignments.reduce((sum, a) => sum + (a.totalRequests || 0), 0);
    const efficiencyScore = CostCalculator.calculateEfficiencyScore(totalCost, totalConnections);

    return {
      expertId,
      dailyCosts,
      monthlyTotals,
      trends: {
        averageDailyCost,
        costTrend,
        projectedMonthlySpend,
        efficiencyScore
      }
    };
  }

  /**
   * Get system-wide cost overview
   */
  async getSystemCostOverview(): Promise<SystemCostOverview> {
    // Get all experts with proxy assignments
    const allExperts = await db
      .select({ id: expertPersonas.id })
      .from(expertPersonas);

    // Calculate costs for each expert
    const expertCosts = await Promise.all(
      allExperts.map(expert => this.getExpertCostSummary(expert.id))
    );

    // Aggregate system metrics
    const totalMonthlyCost = expertCosts.reduce((sum, expert) => sum + expert.currentPeriod.totalCost, 0);
    const expertsOverBudget = expertCosts.filter(expert => expert.budgetStatus.percentUsed >= 100).length;
    const expertsBelowWarningThreshold = expertCosts.filter(
      expert => expert.budgetStatus.percentUsed < COST_LIMITS.WARNING_THRESHOLD * 100
    ).length;
    
    const averageCostPerExpert = allExperts.length > 0 ? totalMonthlyCost / allExperts.length : 0;
    const budgetUtilization = (totalMonthlyCost / (COST_LIMITS.MAX_MONTHLY_BUDGET * allExperts.length)) * 100;
    const projectedSystemCost = expertCosts.reduce((sum, expert) => sum + expert.currentPeriod.projectedMonthlyCost, 0);

    // Get performance metrics
    const allAssignments = await db.select().from(proxyAssignments);
    const averageResponseTime = allAssignments.length > 0 ?
      allAssignments.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) / allAssignments.length : 0;
    
    const totalConnections = allAssignments.reduce((sum, a) => sum + (a.totalRequests || 0), 0);
    const costPerSuccessfulConnection = totalConnections > 0 ? totalMonthlyCost / totalConnections : 0;

    return {
      totalExperts: allExperts.length,
      totalMonthlyCost,
      budgetUtilization,
      expertsOverBudget,
      expertsBelowWarningThreshold,
      averageCostPerExpert,
      projectedSystemCost,
      costEfficiencyMetrics: {
        averageResponseTime,
        costPerSuccessfulConnection,
        totalConnections
      }
    };
  }

  /**
   * Check if expert can afford new proxy assignment
   */
  async canExpertAffordNewProxy(expertId: string, estimatedMonthlyCost: number): Promise<{
    canAfford: boolean;
    reason?: string;
    currentSpend: number;
    availableBudget: number;
    wouldExceedBy?: number;
  }> {
    const costSummary = await this.getExpertCostSummary(expertId);
    const newTotalCost = costSummary.currentPeriod.projectedMonthlyCost + estimatedMonthlyCost;
    
    if (newTotalCost <= COST_LIMITS.MAX_MONTHLY_BUDGET) {
      return {
        canAfford: true,
        currentSpend: costSummary.currentPeriod.totalCost,
        availableBudget: costSummary.budgetStatus.remainingBudget - estimatedMonthlyCost
      };
    } else {
      return {
        canAfford: false,
        reason: 'New proxy would exceed monthly budget limit',
        currentSpend: costSummary.currentPeriod.totalCost,
        availableBudget: costSummary.budgetStatus.remainingBudget,
        wouldExceedBy: newTotalCost - COST_LIMITS.MAX_MONTHLY_BUDGET
      };
    }
  }

  /**
   * Generate monthly cost report for expert
   */
  async generateMonthlyCostReport(expertId: string, month?: string): Promise<{
    reportPeriod: string;
    totalCost: number;
    budgetUtilization: number;
    dailyBreakdown: DailyCostEntry[];
    recommendations: string[];
    comparison: {
      previousMonth: number;
      changePercent: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    const targetMonth = month || new Date().toISOString().substring(0, 7); // YYYY-MM
    const [year, monthNum] = targetMonth.split('-').map(Number);
    
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0);
    
    // Get cost history for the month
    const history = await this.getExpertCostHistory(expertId, 2); // 2 months for comparison
    const monthlyData = history.monthlyTotals.find(m => m.month === targetMonth);
    const currentMonthCost = monthlyData?.totalCost || 0;
    
    // Get previous month for comparison
    const previousMonthStr = new Date(year, monthNum - 2, 1).toISOString().substring(0, 7);
    const previousMonthData = history.monthlyTotals.find(m => m.month === previousMonthStr);
    const previousMonthCost = previousMonthData?.totalCost || 0;
    
    const changePercent = previousMonthCost > 0 ? 
      ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100 : 0;
    
    // Generate recommendations
    const recommendations = this.generateCostRecommendations(currentMonthCost, history.trends);
    
    // Get daily breakdown for the month
    const dailyBreakdown = history.dailyCosts.filter(day => 
      day.date >= monthStart && day.date <= monthEnd
    );

    return {
      reportPeriod: targetMonth,
      totalCost: currentMonthCost,
      budgetUtilization: (currentMonthCost / COST_LIMITS.MAX_MONTHLY_BUDGET) * 100,
      dailyBreakdown,
      recommendations,
      comparison: {
        previousMonth: previousMonthCost,
        changePercent,
        trend: CostCalculator.analyzeCostTrend(history.dailyCosts)
      }
    };
  }

  // Private helper methods

  private buildDailyCostEntries(assignments: any[], startDate: Date, endDate: Date): DailyCostEntry[] {
    const dailyCosts: DailyCostEntry[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59);

      // Calculate cost for this day
      const activeAssignments = assignments.filter(a => {
        const assignedDate = a.costTrackingStartDate || a.createdAt;
        return assignedDate <= dayEnd && (a.assignmentStatus === 'active' || a.assignmentStatus === 'testing');
      });

      const totalCost = activeAssignments.reduce((sum, assignment) => {
        const dailyCost = parseFloat(assignment.dailyCostUsd?.toString() || '0');
        return sum + dailyCost;
      }, 0);

      const averageCostPerProxy = activeAssignments.length > 0 ? totalCost / activeAssignments.length : 0;

      dailyCosts.push({
        date: new Date(currentDate),
        totalCost,
        proxyCount: activeAssignments.length,
        averageCostPerProxy
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyCosts;
  }

  private buildMonthlyCostEntries(dailyCosts: DailyCostEntry[]): MonthlyCostEntry[] {
    const monthlyTotals: Map<string, MonthlyCostEntry> = new Map();

    dailyCosts.forEach(day => {
      const monthKey = day.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, {
          month: monthKey,
          totalCost: 0,
          proxyCount: 0,
          budgetUtilization: 0
        });
      }

      const monthData = monthlyTotals.get(monthKey)!;
      monthData.totalCost += day.totalCost;
      monthData.proxyCount = Math.max(monthData.proxyCount, day.proxyCount);
      monthData.budgetUtilization = (monthData.totalCost / COST_LIMITS.MAX_MONTHLY_BUDGET) * 100;
    });

    return Array.from(monthlyTotals.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  private generateCostRecommendations(currentCost: number, trends: any): string[] {
    const recommendations: string[] = [];
    
    if (currentCost > COST_LIMITS.MAX_MONTHLY_BUDGET * 0.8) {
      recommendations.push('Consider optimizing proxy usage to stay within budget');
    }
    
    if (trends.costTrend === 'increasing') {
      recommendations.push('Monitor increasing cost trend and consider proxy consolidation');
    }
    
    if (trends.efficiencyScore > 0.1) {
      recommendations.push('Review proxy performance to improve cost efficiency');
    }
    
    if (currentCost < COST_LIMITS.MAX_MONTHLY_BUDGET * 0.5) {
      recommendations.push('Budget utilization is low - consider additional proxies if needed');
    }

    return recommendations;
  }

  /**
   * Health check for cost management service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const systemOverview = await this.getSystemCostOverview();
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (systemOverview.expertsOverBudget > systemOverview.totalExperts * 0.5) {
        status = 'unhealthy';
      } else if (systemOverview.budgetUtilization > 90) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          totalExperts: systemOverview.totalExperts,
          totalMonthlyCost: systemOverview.totalMonthlyCost,
          expertsOverBudget: systemOverview.expertsOverBudget,
          budgetUtilization: systemOverview.budgetUtilization,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Singleton service instance
let costManagementServiceInstance: CostManagementService | null = null;

/**
 * Get singleton cost management service instance
 */
export function getCostManagementService(): CostManagementService {
  if (!costManagementServiceInstance) {
    costManagementServiceInstance = new CostManagementService();
  }
  return costManagementServiceInstance;
}

/**
 * Utility function to check expert budget before proxy assignment
 */
export async function validateExpertBudget(expertId: string, estimatedCost: number): Promise<boolean> {
  const service = getCostManagementService();
  const result = await service.canExpertAffordNewProxy(expertId, estimatedCost);
  return result.canAfford;
}