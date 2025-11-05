-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "currentHour" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NPC" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "occupation" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'alive',
    "locationId" TEXT NOT NULL,
    "openness" INTEGER NOT NULL DEFAULT 50,
    "conscientiousness" INTEGER NOT NULL DEFAULT 50,
    "extraversion" INTEGER NOT NULL DEFAULT 50,
    "agreeableness" INTEGER NOT NULL DEFAULT 50,
    "neuroticism" INTEGER NOT NULL DEFAULT 50,
    "values" TEXT NOT NULL DEFAULT '[]',
    "fears" TEXT NOT NULL DEFAULT '[]',
    "formality" INTEGER NOT NULL DEFAULT 50,
    "verbosity" INTEGER NOT NULL DEFAULT 50,
    "emotionalExpression" INTEGER NOT NULL DEFAULT 50,
    "dialect" TEXT NOT NULL DEFAULT '',
    "speechQuirks" TEXT NOT NULL DEFAULT '[]',
    "needFood" INTEGER NOT NULL DEFAULT 100,
    "needSafety" INTEGER NOT NULL DEFAULT 100,
    "needWealth" INTEGER NOT NULL DEFAULT 50,
    "needSocial" INTEGER NOT NULL DEFAULT 50,
    "needPurpose" INTEGER NOT NULL DEFAULT 50,
    "emotionHappiness" INTEGER NOT NULL DEFAULT 50,
    "emotionAnger" INTEGER NOT NULL DEFAULT 0,
    "emotionFear" INTEGER NOT NULL DEFAULT 0,
    "emotionSadness" INTEGER NOT NULL DEFAULT 0,
    "emotionTrust" INTEGER NOT NULL DEFAULT 50,
    "emotionAnticipation" INTEGER NOT NULL DEFAULT 30,
    "emotionLove" INTEGER NOT NULL DEFAULT 0,
    "emotionDesperation" INTEGER NOT NULL DEFAULT 0,
    "emotionGrief" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NPC_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NPC_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npcId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL DEFAULT '',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "desperate" BOOLEAN NOT NULL DEFAULT false,
    "deadline" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT '[]',
    "obstacles" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "NPC" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromNpcId" TEXT NOT NULL,
    "toNpcId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "trust" INTEGER NOT NULL DEFAULT 0,
    "affection" INTEGER NOT NULL DEFAULT 0,
    "respect" INTEGER NOT NULL DEFAULT 0,
    "grudge" INTEGER NOT NULL DEFAULT 0,
    "fear" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Relationship_fromNpcId_fkey" FOREIGN KEY ("fromNpcId") REFERENCES "NPC" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Relationship_toNpcId_fkey" FOREIGN KEY ("toNpcId") REFERENCES "NPC" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npcId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "emotionalImpact" INTEGER NOT NULL DEFAULT 50,
    "involvedNpcs" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memory_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "NPC" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "targetId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "consequences" TEXT NOT NULL DEFAULT '[]',
    "dramaticValue" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "NPC" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'building',
    "hasFood" BOOLEAN NOT NULL DEFAULT false,
    "hasShelter" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "dangerLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npcId" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Schedule_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "NPC" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Faction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'neutral',
    "memberIds" TEXT NOT NULL DEFAULT '[]',
    "leaderIds" TEXT NOT NULL DEFAULT '[]',
    "wealth" INTEGER NOT NULL DEFAULT 50,
    "power" INTEGER NOT NULL DEFAULT 50,
    "influence" INTEGER NOT NULL DEFAULT 50,
    "relationships" TEXT NOT NULL DEFAULT '{}',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Faction_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "relationships" TEXT NOT NULL DEFAULT '{}',
    "activeQuests" TEXT NOT NULL DEFAULT '[]',
    "completedQuests" TEXT NOT NULL DEFAULT '[]',
    "failedQuests" TEXT NOT NULL DEFAULT '[]',
    "recentChoices" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_EventParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EventParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EventParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "NPC" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NPC_worldId_idx" ON "NPC"("worldId");

-- CreateIndex
CREATE INDEX "NPC_locationId_idx" ON "NPC"("locationId");

-- CreateIndex
CREATE INDEX "Goal_npcId_idx" ON "Goal"("npcId");

-- CreateIndex
CREATE INDEX "Relationship_fromNpcId_idx" ON "Relationship"("fromNpcId");

-- CreateIndex
CREATE INDEX "Relationship_toNpcId_idx" ON "Relationship"("toNpcId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_fromNpcId_toNpcId_key" ON "Relationship"("fromNpcId", "toNpcId");

-- CreateIndex
CREATE INDEX "Memory_npcId_idx" ON "Memory"("npcId");

-- CreateIndex
CREATE INDEX "Memory_day_idx" ON "Memory"("day");

-- CreateIndex
CREATE INDEX "Event_worldId_idx" ON "Event"("worldId");

-- CreateIndex
CREATE INDEX "Event_day_idx" ON "Event"("day");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Location_worldId_idx" ON "Location"("worldId");

-- CreateIndex
CREATE INDEX "Schedule_npcId_idx" ON "Schedule"("npcId");

-- CreateIndex
CREATE INDEX "Schedule_hour_idx" ON "Schedule"("hour");

-- CreateIndex
CREATE INDEX "Faction_worldId_idx" ON "Faction"("worldId");

-- CreateIndex
CREATE UNIQUE INDEX "_EventParticipants_AB_unique" ON "_EventParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_EventParticipants_B_index" ON "_EventParticipants"("B");
