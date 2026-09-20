-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "savedSignatureKey" TEXT,
    "consents" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "address" TEXT,
    "postcode" TEXT,
    "addrCheckedAt" TIMESTAMP(3),
    "pausedReason" TEXT,
    "pausedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occasion" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "monthDay" TEXT,
    "feastKey" TEXT,
    "startYear" INTEGER,
    "adhocDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "occasionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "cardSpec" JSONB NOT NULL,
    "aiReason" TEXT,
    "madeBy" TEXT NOT NULL DEFAULT 'rule',
    "messageBy" TEXT NOT NULL DEFAULT 'rule',
    "flags" JSONB NOT NULL DEFAULT '[]',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "proposalId" TEXT,
    "personId" TEXT,
    "recipientName" TEXT NOT NULL,
    "occasionType" TEXT NOT NULL,
    "occasionDate" TIMESTAMP(3) NOT NULL,
    "cardSpec" JSONB NOT NULL,
    "quote" JSONB NOT NULL,
    "totalPence" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "promisedDate" TIMESTAMP(3) NOT NULL,
    "guarantee" BOOLEAN NOT NULL DEFAULT false,
    "stage" TEXT NOT NULL DEFAULT 'checked',
    "stageHistory" JSONB NOT NULL DEFAULT '[]',
    "delayed" BOOLEAN NOT NULL DEFAULT false,
    "printerId" TEXT,
    "batchId" TEXT,
    "recipientSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "printerId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'first',
    "carrier" TEXT,
    "trackingEvents" JSONB NOT NULL DEFAULT '[]',
    "inspectionScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recovery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "costPence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "checks" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCard" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "animation" TEXT NOT NULL DEFAULT 'envelope',
    "narrationKey" TEXT,
    "narrationUrl" TEXT,
    "clipUrl" TEXT,
    "drawingUrl" TEXT,
    "wordTimings" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "digitalCardId" TEXT,
    "orderId" TEXT,
    "direction" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "occasionType" TEXT NOT NULL,
    "design" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "keptUntil" TIMESTAMP(3) NOT NULL,
    "cardSpec" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "sizes" TEXT[],
    "finishes" TEXT[],
    "areas" TEXT[],
    "capacity" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'payg',
    "deliveryOption" TEXT NOT NULL DEFAULT 'posted',
    "staffText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRow" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT,
    "monthDay" TEXT,
    "occasion" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "issue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sendDate" TIMESTAMP(3) NOT NULL,
    "deliveryOption" TEXT NOT NULL,
    "finish" TEXT NOT NULL,
    "cardCount" INTEGER NOT NULL,
    "giantCount" INTEGER NOT NULL DEFAULT 0,
    "pricePence" INTEGER NOT NULL,
    "contributionPence" INTEGER NOT NULL,
    "rows" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "feePence" INTEGER NOT NULL DEFAULT 0,
    "commissionPct" INTEGER NOT NULL DEFAULT 0,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "personId" TEXT,
    "ledger" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "costMicroPence" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ranAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Person_accountId_idx" ON "Person"("accountId");

-- CreateIndex
CREATE INDEX "Occasion_personId_idx" ON "Occasion"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_key_key" ON "Proposal"("key");

-- CreateIndex
CREATE INDEX "Proposal_personId_idx" ON "Proposal"("personId");

-- CreateIndex
CREATE INDEX "Proposal_status_dueDate_idx" ON "Proposal"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Order_recipientSlug_key" ON "Order"("recipientSlug");

-- CreateIndex
CREATE INDEX "Order_accountId_createdAt_idx" ON "Order"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_stage_idx" ON "Order"("stage");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Recovery_orderId_key" ON "Recovery"("orderId");

-- CreateIndex
CREATE INDEX "Media_accountId_idx" ON "Media"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCard_orderId_key" ON "DigitalCard"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCard_slug_key" ON "DigitalCard"("slug");

-- CreateIndex
CREATE INDEX "InventoryItem_accountId_direction_idx" ON "InventoryItem"("accountId", "direction");

-- CreateIndex
CREATE INDEX "InventoryItem_orderId_idx" ON "InventoryItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_orderId_key" ON "Rating"("orderId");

-- CreateIndex
CREATE INDEX "StaffRow_organisationId_idx" ON "StaffRow"("organisationId");

-- CreateIndex
CREATE INDEX "Batch_organisationId_idx" ON "Batch"("organisationId");

-- CreateIndex
CREATE INDEX "Referral_partnerId_idx" ON "Referral"("partnerId");

-- CreateIndex
CREATE INDEX "Decision_at_idx" ON "Decision"("at");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occasion" ADD CONSTRAINT "Occasion_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "Occasion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalCard" ADD CONSTRAINT "DigitalCard_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_digitalCardId_fkey" FOREIGN KEY ("digitalCardId") REFERENCES "DigitalCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRow" ADD CONSTRAINT "StaffRow_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
