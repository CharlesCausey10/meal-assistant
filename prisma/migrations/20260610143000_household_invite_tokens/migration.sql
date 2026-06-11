ALTER TABLE "Household" ADD COLUMN "inviteToken" TEXT;
ALTER TABLE "Household" ADD COLUMN "inviteTokenCreatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Household_inviteToken_key" ON "Household"("inviteToken");
