declare const router: import("express-serve-static-core").Router;
/**
 * Real-time verification code delivery function (called from SMS processing)
 * This function is called when a new verification code is extracted
 */
export declare function deliverVerificationCodeToExpert(expertId: string, verificationCode: {
    codeId: string;
    verificationCode: string;
    codeType: string;
    platformType: string;
    extractedAt: Date;
    expiresAt: Date;
    isValid: boolean;
}): Promise<void>;
export { router as dashboardRouter };
//# sourceMappingURL=dashboard.d.ts.map