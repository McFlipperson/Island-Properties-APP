"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostManagementService = void 0;
exports.getCostManagementService = getCostManagementService;
exports.validateExpertBudget = validateExpertBudget;
const index_1 = require("./db/index");
const schema_1 = require("../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
// Cost management constants
const COST_LIMITS = {
    MAX_MONTHLY_BUDGET: 6.35, // USD per expert
    MAX_DAILY_BUDGET: 0.25, // USD per expert (roughly monthly/30)
    WARNING_THRESHOLD: 0.8, // 80% of budget
    CRITICAL_THRESHOLD: 0.95, // 95% of budget
    OVERAGE_THRESHOLD: 1.0, // 100% of budget
};
// Cost calculation utilities
class CostCalculator {
    /**
     * Calculate current month cost for expert
     */
    static async calculateCurrentMonthCost(expertId) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const assignments = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId), (0, drizzle_orm_1.gte)(schema_1.proxyAssignments.costTrackingStartDate, monthStart), (0, drizzle_orm_1.lte)(schema_1.proxyAssignments.costTrackingStartDate, monthEnd)));
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
    static calculateProjectedMonthlyCost(currentCost, daysElapsed) {
        if (daysElapsed === 0)
            return 0;
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyAverage = currentCost / daysElapsed;
        return dailyAverage * daysInMonth;
    }
    /**
     * Calculate cost efficiency metrics
     */
    static calculateEfficiencyScore(totalCost, successfulConnections) {
        if (successfulConnections === 0)
            return 0;
        return totalCost / successfulConnections;
    }
    /**
     * Determine cost trend from historical data
     */
    static analyzeCostTrend(dailyCosts) {
        if (dailyCosts.length < 3)
            return 'stable';
        const recent = dailyCosts.slice(-7); // Last 7 days
        const older = dailyCosts.slice(-14, -7); // Previous 7 days
        const recentAvg = recent.reduce((sum, entry) => sum + entry.totalCost, 0) / recent.length;
        const olderAvg = older.length > 0 ?
            older.reduce((sum, entry) => sum + entry.totalCost, 0) / older.length : recentAvg;
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (changePercent > 10)
            return 'increasing';
        if (changePercent < -10)
            return 'decreasing';
        return 'stable';
    }
}
// Alert generation for cost management
class CostAlertManager {
    /**
     * Generate cost alerts based on spending patterns
     */
    static generateCostAlerts(expertId, costSummary) {
        const alerts = [];
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
        }
        else if (budgetStatus.percentUsed >= COST_LIMITS.WARNING_THRESHOLD * 100) {
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
class CostManagementService {
    /**
     * Get comprehensive cost summary for expert
     */
    async getExpertCostSummary(expertId) {
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
        const activeAssignments = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId), (0, drizzle_orm_1.eq)(schema_1.proxyAssignments.assignmentStatus, 'active')));
        const proxyCosts = activeAssignments.map(a => parseFloat(a.monthlyCostUsd?.toString() || '0'));
        const costBreakdown = {
            proxyCount: activeAssignments.length,
            averageCostPerProxy: proxyCosts.length > 0 ? proxyCosts.reduce((sum, cost) => sum + cost, 0) / proxyCosts.length : 0,
            highestCostProxy: proxyCosts.length > 0 ? Math.max(...proxyCosts) : 0,
            lowestCostProxy: proxyCosts.length > 0 ? Math.min(...proxyCosts) : 0
        };
        const costSummary = {
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
    async getExpertCostHistory(expertId, months = 6) {
        const endDate = new Date();
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months, 1);
        // Get all assignments in the period
        const assignments = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId), (0, drizzle_orm_1.gte)(schema_1.proxyAssignments.createdAt, startDate)))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.proxyAssignments.createdAt));
        // Build daily cost entries
        const dailyCosts = this.buildDailyCostEntries(assignments, startDate, endDate);
        // Build monthly totals
        const monthlyTotals = this.buildMonthlyCostEntries(dailyCosts);
        // Analyze trends
        const averageDailyCost = dailyCosts.length > 0 ?
            dailyCosts.reduce((sum, entry) => sum + entry.totalCost, 0) / dailyCosts.length : 0;
        const costTrend = CostCalculator.analyzeCostTrend(dailyCosts);
        const projectedMonthlySpend = CostCalculator.calculateProjectedMonthlyCost(averageDailyCost * new Date().getDate(), new Date().getDate());
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
    async getSystemCostOverview() {
        // Get all experts with proxy assignments
        const allExperts = await index_1.db
            .select({ id: schema_1.expertPersonas.id })
            .from(schema_1.expertPersonas);
        // Calculate costs for each expert
        const expertCosts = await Promise.all(allExperts.map(expert => this.getExpertCostSummary(expert.id)));
        // Aggregate system metrics
        const totalMonthlyCost = expertCosts.reduce((sum, expert) => sum + expert.currentPeriod.totalCost, 0);
        const expertsOverBudget = expertCosts.filter(expert => expert.budgetStatus.percentUsed >= 100).length;
        const expertsBelowWarningThreshold = expertCosts.filter(expert => expert.budgetStatus.percentUsed < COST_LIMITS.WARNING_THRESHOLD * 100).length;
        const averageCostPerExpert = allExperts.length > 0 ? totalMonthlyCost / allExperts.length : 0;
        const budgetUtilization = (totalMonthlyCost / (COST_LIMITS.MAX_MONTHLY_BUDGET * allExperts.length)) * 100;
        const projectedSystemCost = expertCosts.reduce((sum, expert) => sum + expert.currentPeriod.projectedMonthlyCost, 0);
        // Get performance metrics
        const allAssignments = await index_1.db.select().from(schema_1.proxyAssignments);
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
    async canExpertAffordNewProxy(expertId, estimatedMonthlyCost) {
        const costSummary = await this.getExpertCostSummary(expertId);
        const newTotalCost = costSummary.currentPeriod.projectedMonthlyCost + estimatedMonthlyCost;
        if (newTotalCost <= COST_LIMITS.MAX_MONTHLY_BUDGET) {
            return {
                canAfford: true,
                currentSpend: costSummary.currentPeriod.totalCost,
                availableBudget: costSummary.budgetStatus.remainingBudget - estimatedMonthlyCost
            };
        }
        else {
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
    async generateMonthlyCostReport(expertId, month) {
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
        const dailyBreakdown = history.dailyCosts.filter(day => day.date >= monthStart && day.date <= monthEnd);
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
    buildDailyCostEntries(assignments, startDate, endDate) {
        const dailyCosts = [];
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
    buildMonthlyCostEntries(dailyCosts) {
        const monthlyTotals = new Map();
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
            const monthData = monthlyTotals.get(monthKey);
            monthData.totalCost += day.totalCost;
            monthData.proxyCount = Math.max(monthData.proxyCount, day.proxyCount);
            monthData.budgetUtilization = (monthData.totalCost / COST_LIMITS.MAX_MONTHLY_BUDGET) * 100;
        });
        return Array.from(monthlyTotals.values()).sort((a, b) => a.month.localeCompare(b.month));
    }
    generateCostRecommendations(currentCost, trends) {
        const recommendations = [];
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
    async healthCheck() {
        try {
            const systemOverview = await this.getSystemCostOverview();
            let status = 'healthy';
            if (systemOverview.expertsOverBudget > systemOverview.totalExperts * 0.5) {
                status = 'unhealthy';
            }
            else if (systemOverview.budgetUtilization > 90) {
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
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}
exports.CostManagementService = CostManagementService;
// Singleton service instance
let costManagementServiceInstance = null;
/**
 * Get singleton cost management service instance
 */
function getCostManagementService() {
    if (!costManagementServiceInstance) {
        costManagementServiceInstance = new CostManagementService();
    }
    return costManagementServiceInstance;
}
/**
 * Utility function to check expert budget before proxy assignment
 */
async function validateExpertBudget(expertId, estimatedCost) {
    const service = getCostManagementService();
    const result = await service.canExpertAffordNewProxy(expertId, estimatedCost);
    return result.canAfford;
}
//# sourceMappingURL=cost-management-service.js.map