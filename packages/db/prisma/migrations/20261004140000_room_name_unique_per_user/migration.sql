-- DropIndex
DROP INDEX "Room_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Room_creatorId_name_key" ON "Room"("creatorId", "name");
