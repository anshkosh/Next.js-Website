-- Legacy addresses remain unconfirmed; never activate them by migration.
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "confirmedAt" TIMESTAMP(3), ADD COLUMN "unsubscribedAt" TIMESTAMP(3), ADD COLUMN "unsubscribeTokenHash" TEXT, ADD COLUMN "consentVersion" TEXT;
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeTokenHash_key" ON "NewsletterSubscriber"("unsubscribeTokenHash");
