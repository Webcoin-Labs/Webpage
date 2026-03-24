CREATE INDEX "FounderProfile_isHiring_updatedAt_idx" ON "FounderProfile"("isHiring", "updatedAt");

CREATE INDEX "Project_ownerUserId_updatedAt_idx" ON "Project"("ownerUserId", "updatedAt");

CREATE INDEX "Application_userId_createdAt_idx" ON "Application"("userId", "createdAt");

CREATE INDEX "IntroRequest_founderId_createdAt_idx" ON "IntroRequest"("founderId", "createdAt");
CREATE INDEX "IntroRequest_founderId_type_updatedAt_idx" ON "IntroRequest"("founderId", "type", "updatedAt");

CREATE INDEX "PitchDeck_userId_createdAt_idx" ON "PitchDeck"("userId", "createdAt");
