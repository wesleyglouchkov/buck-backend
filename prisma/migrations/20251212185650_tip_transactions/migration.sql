-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_account_id" TEXT,
ADD COLUMN     "stripe_connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tip_transactions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "livestream_id" TEXT,
    "buck_amount" DECIMAL(10,2) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL,
    "creator_receives_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripe_payment_intent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "tip_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tip_transactions_session_id_key" ON "tip_transactions"("session_id");

-- AddForeignKey
ALTER TABLE "tip_transactions" ADD CONSTRAINT "tip_transactions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tip_transactions" ADD CONSTRAINT "tip_transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
