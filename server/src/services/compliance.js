import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { Models } from '../models.js';

// Initialize storage
if (!Models.kycRecords) Models.kycRecords = new Map();
if (!Models.idvSessions) Models.idvSessions = new Map();
if (!Models.amlScreenings) Models.amlScreenings = new Map();
if (!Models.complianceDocuments) Models.complianceDocuments = new Map();
if (!Models.consentRecords) Models.consentRecords = new Map();

// KYC status levels
const KYC_LEVELS = {
  none: { label: 'Not Verified', cashAdvanceLimit: 0, dailyLimit: 0 },
  basic: { label: 'Basic Verified', cashAdvanceLimit: 50, dailyLimit: 200 },
  standard: { label: 'Standard Verified', cashAdvanceLimit: 150, dailyLimit: 500 },
  enhanced: { label: 'Enhanced Verified', cashAdvanceLimit: 500, dailyLimit: 2000 },
};

// Simulated watchlists
const WATCHLIST_TYPES = ['OFAC', 'PEP', 'SANCTIONS', 'ADVERSE_MEDIA'];

export const ComplianceService = {
  // Initiate KYC verification
  initiateKyc: ({ userId, level = 'basic' }) => {
    const existing = Models.kycRecords.get(userId);
    if (existing && existing.status === 'approved' && existing.level >= level) {
      return { status: 'already_verified', currentLevel: existing.level };
    }

    const session = {
      id: uuid(),
      userId,
      requestedLevel: level,
      status: 'pending',
      steps: {
        identity: { status: 'pending', completedAt: null },
        address: { status: 'pending', completedAt: null },
        document: { status: 'pending', completedAt: null },
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    Models.idvSessions.set(session.id, session);
    Models.auditLog.push({ type: 'kyc_initiated', userId, sessionId: session.id, level });

    return {
      sessionId: session.id,
      steps: ['identity', 'address', 'document'],
      expiresAt: session.expiresAt,
    };
  },

  // Submit identity verification data
  submitIdentity: ({ sessionId, data }) => {
    const session = Models.idvSessions.get(sessionId);
    if (!session) throw new Error('session_not_found');
    if (new Date(session.expiresAt) < new Date()) throw new Error('session_expired');

    // Validate required fields
    const required = ['firstName', 'lastName', 'dateOfBirth', 'ssn'];
    for (const field of required) {
      if (!data[field]) throw new Error(`missing_field: ${field}`);
    }

    // Encrypt sensitive data (in production, use proper encryption)
    const encryptedSsn = crypto.createHash('sha256')
      .update(data.ssn)
      .digest('hex');

    session.identity = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      ssnHash: encryptedSsn,
      submittedAt: new Date().toISOString(),
    };
    session.steps.identity.status = 'completed';
    session.steps.identity.completedAt = new Date().toISOString();

    Models.auditLog.push({ type: 'kyc_identity_submitted', sessionId });

    return { step: 'identity', status: 'completed', nextStep: 'address' };
  },

  // Submit address verification
  submitAddress: ({ sessionId, data }) => {
    const session = Models.idvSessions.get(sessionId);
    if (!session) throw new Error('session_not_found');

    const required = ['street', 'city', 'state', 'zipCode', 'country'];
    for (const field of required) {
      if (!data[field]) throw new Error(`missing_field: ${field}`);
    }

    session.address = {
      ...data,
      submittedAt: new Date().toISOString(),
    };
    session.steps.address.status = 'completed';
    session.steps.address.completedAt = new Date().toISOString();

    return { step: 'address', status: 'completed', nextStep: 'document' };
  },

  // Submit document verification
  submitDocument: ({ sessionId, documentType, documentData }) => {
    const session = Models.idvSessions.get(sessionId);
    if (!session) throw new Error('session_not_found');

    const validTypes = ['drivers_license', 'passport', 'state_id', 'utility_bill'];
    if (!validTypes.includes(documentType)) {
      throw new Error('invalid_document_type');
    }

    session.document = {
      type: documentType,
      // In production, store document reference, not actual data
      referenceId: uuid(),
      submittedAt: new Date().toISOString(),
    };
    session.steps.document.status = 'completed';
    session.steps.document.completedAt = new Date().toISOString();

    // Run verification
    return ComplianceService.processVerification({ sessionId });
  },

  // Process verification (simulated)
  processVerification: async ({ sessionId }) => {
    const session = Models.idvSessions.get(sessionId);
    if (!session) throw new Error('session_not_found');

    // Check all steps completed
    const allComplete = Object.values(session.steps).every(s => s.status === 'completed');
    if (!allComplete) {
      const incomplete = Object.entries(session.steps)
        .filter(([, s]) => s.status !== 'completed')
        .map(([step]) => step);
      return { status: 'incomplete', missingSteps: incomplete };
    }

    // Run AML screening
    const amlResult = await ComplianceService.runAmlScreening({
      userId: session.userId,
      fullName: `${session.identity.firstName} ${session.identity.lastName}`,
      dateOfBirth: session.identity.dateOfBirth,
    });

    if (amlResult.hasMatches) {
      session.status = 'review_required';
      Models.auditLog.push({ type: 'kyc_aml_match', sessionId, matches: amlResult.matches });
      
      return {
        status: 'review_required',
        reason: 'aml_screening_match',
        estimatedReviewTime: '24-48 hours',
      };
    }

    // Approve KYC
    const kycRecord = {
      userId: session.userId,
      level: session.requestedLevel,
      status: 'approved',
      sessionId,
      identity: session.identity,
      address: session.address,
      document: session.document,
      approvedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      limits: KYC_LEVELS[session.requestedLevel],
    };

    Models.kycRecords.set(session.userId, kycRecord);
    session.status = 'approved';
    Models.auditLog.push({ type: 'kyc_approved', userId: session.userId, level: session.requestedLevel });
    Models.metrics.increment('compliance.kyc_approved');

    return {
      status: 'approved',
      level: session.requestedLevel,
      limits: KYC_LEVELS[session.requestedLevel],
    };
  },

  // Run AML screening
  runAmlScreening: async ({ userId, fullName, dateOfBirth }) => {
    const screening = {
      id: uuid(),
      userId,
      fullName,
      dateOfBirth,
      screenedAt: new Date().toISOString(),
      watchlistsChecked: WATCHLIST_TYPES,
      matches: [],
      hasMatches: false,
    };

    // Simulated screening - in production, call actual AML provider
    // For now, always return clean unless name contains specific test strings
    if (fullName.toLowerCase().includes('test_match')) {
      screening.hasMatches = true;
      screening.matches.push({
        watchlist: 'SANCTIONS',
        matchScore: 0.85,
        matchedName: fullName,
        reason: 'Name similarity',
      });
    }

    Models.amlScreenings.set(screening.id, screening);
    Models.metrics.increment('compliance.aml_screenings');

    return screening;
  },

  // Get KYC status
  getKycStatus: ({ userId }) => {
    const record = Models.kycRecords.get(userId);
    
    if (!record) {
      return {
        status: 'not_verified',
        level: 'none',
        limits: KYC_LEVELS.none,
        canInitiate: true,
      };
    }

    // Check expiry
    if (new Date(record.expiresAt) < new Date()) {
      return {
        status: 'expired',
        level: record.level,
        limits: KYC_LEVELS.none,
        expiredAt: record.expiresAt,
        canRenew: true,
      };
    }

    return {
      status: record.status,
      level: record.level,
      limits: record.limits,
      approvedAt: record.approvedAt,
      expiresAt: record.expiresAt,
    };
  },

  // Record consent
  recordConsent: ({ userId, consentType, version, ipAddress, userAgent }) => {
    const consent = {
      id: uuid(),
      userId,
      consentType, // 'terms', 'privacy', 'data_sharing', 'marketing'
      version,
      granted: true,
      ipAddress,
      userAgent,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
    };

    const userConsents = Models.consentRecords.get(userId) || [];
    userConsents.push(consent);
    Models.consentRecords.set(userId, userConsents);
    Models.auditLog.push({ type: 'consent_granted', userId, consentType, version });

    return consent;
  },

  // Revoke consent
  revokeConsent: ({ userId, consentType }) => {
    const userConsents = Models.consentRecords.get(userId) || [];
    const latestConsent = userConsents
      .filter(c => c.consentType === consentType && !c.revokedAt)
      .sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt))[0];

    if (!latestConsent) {
      throw new Error('consent_not_found');
    }

    latestConsent.revokedAt = new Date().toISOString();
    Models.auditLog.push({ type: 'consent_revoked', userId, consentType });

    return { revoked: true, consentType };
  },

  // Check consent status
  checkConsent: ({ userId, consentType, requiredVersion }) => {
    const userConsents = Models.consentRecords.get(userId) || [];
    const latestConsent = userConsents
      .filter(c => c.consentType === consentType && !c.revokedAt)
      .sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt))[0];

    if (!latestConsent) {
      return { hasConsent: false, needsConsent: true };
    }

    if (requiredVersion && latestConsent.version !== requiredVersion) {
      return { hasConsent: false, needsUpdate: true, currentVersion: latestConsent.version };
    }

    return { hasConsent: true, version: latestConsent.version, grantedAt: latestConsent.grantedAt };
  },

  // Data subject request (GDPR/CCPA)
  createDataRequest: ({ userId, requestType }) => {
    const validTypes = ['access', 'deletion', 'portability', 'rectification', 'restriction'];
    if (!validTypes.includes(requestType)) {
      throw new Error('invalid_request_type');
    }

    const request = {
      id: uuid(),
      userId,
      requestType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
    };

    const userRequests = Models.complianceDocuments.get(`requests:${userId}`) || [];
    userRequests.push(request);
    Models.complianceDocuments.set(`requests:${userId}`, userRequests);
    Models.auditLog.push({ type: 'data_request_created', userId, requestType, requestId: request.id });
    Models.metrics.increment(`compliance.data_requests.${requestType}`);

    return {
      requestId: request.id,
      requestType,
      status: 'pending',
      estimatedCompletion: request.dueDate,
    };
  },

  // Export user data (for access/portability requests)
  exportUserData: ({ userId }) => {
    // Collect all user data
    const data = {
      exportedAt: new Date().toISOString(),
      userId,
      profile: Models.profiles?.get(userId) || null,
      earnings: Array.from(Models.earnings?.values() || []).filter(e => e.userId === userId),
      expenses: Array.from(Models.expenses?.values() || []).filter(e => e.userId === userId),
      shifts: Array.from(Models.shifts?.values() || []).filter(s => s.userId === userId),
      goals: Array.from(Models.goals?.values() || []).filter(g => g.userId === userId),
      platforms: Array.from(Models.platforms?.values() || []).filter(p => p.userId === userId),
      consents: Models.consentRecords.get(userId) || [],
      // Note: Sensitive data like SSN hashes are not included
    };

    Models.auditLog.push({ type: 'user_data_exported', userId });

    return {
      format: 'json',
      data,
      downloadUrl: `/api/v1/compliance/exports/${uuid()}`, // Would be a signed URL in production
      expiresIn: '24h',
    };
  },

  // Get compliance summary
  getComplianceSummary: ({ userId }) => {
    const kyc = ComplianceService.getKycStatus({ userId });
    const consents = Models.consentRecords.get(userId) || [];
    const activeConsents = consents.filter(c => !c.revokedAt);
    const requests = Models.complianceDocuments.get(`requests:${userId}`) || [];
    const pendingRequests = requests.filter(r => r.status === 'pending');

    return {
      userId,
      kyc,
      consents: {
        active: activeConsents.length,
        types: [...new Set(activeConsents.map(c => c.consentType))],
      },
      dataRequests: {
        total: requests.length,
        pending: pendingRequests.length,
      },
      lastReviewDate: kyc.approvedAt || null,
    };
  },

  // Admin: List pending KYC reviews
  getPendingReviews: ({ limit = 50 }) => {
    const pending = [];
    for (const session of Models.idvSessions.values()) {
      if (session.status === 'review_required' || session.status === 'pending') {
        pending.push({
          sessionId: session.id,
          userId: session.userId,
          status: session.status,
          requestedLevel: session.requestedLevel,
          createdAt: session.createdAt,
        });
      }
    }

    return {
      pending: pending.slice(0, limit),
      total: pending.length,
    };
  },

  // Admin: Approve/Reject KYC
  reviewKyc: ({ sessionId, decision, reviewerId, notes }) => {
    const session = Models.idvSessions.get(sessionId);
    if (!session) throw new Error('session_not_found');

    if (decision === 'approve') {
      const kycRecord = {
        userId: session.userId,
        level: session.requestedLevel,
        status: 'approved',
        sessionId,
        identity: session.identity,
        address: session.address,
        document: session.document,
        approvedAt: new Date().toISOString(),
        approvedBy: reviewerId,
        reviewNotes: notes,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        limits: KYC_LEVELS[session.requestedLevel],
      };

      Models.kycRecords.set(session.userId, kycRecord);
      session.status = 'approved';
    } else {
      session.status = 'rejected';
      session.rejectionReason = notes;
      session.rejectedBy = reviewerId;
      session.rejectedAt = new Date().toISOString();
    }

    Models.auditLog.push({ type: `kyc_${decision}`, sessionId, reviewerId, notes });
    return { sessionId, decision, status: session.status };
  },
};
