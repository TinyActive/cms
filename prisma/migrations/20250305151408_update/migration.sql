/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `dropletId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `firewallId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `cpu` on the `Droplet` table. All the data in the column will be lost.
  - You are about to drop the column `digitalOceanId` on the `Droplet` table. All the data in the column will be lost.
  - You are about to drop the column `disk` on the `Droplet` table. All the data in the column will be lost.
  - You are about to drop the column `memory` on the `Droplet` table. All the data in the column will be lost.
  - You are about to drop the column `digitalOceanId` on the `Firewall` table. All the data in the column will be lost.
  - You are about to drop the column `inboundRules` on the `Firewall` table. All the data in the column will be lost.
  - You are about to drop the column `outboundRules` on the `Firewall` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TelegramNotification` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `digitalOceanId` on the `VPS` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `VPS` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[token]` on the table `DigitalOceanToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doId]` on the table `Droplet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doId]` on the table `Firewall` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ServerRegion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `doId` to the `Droplet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doId` to the `Firewall` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FirewallDroplet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `TelegramNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TelegramNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Activity` DROP FOREIGN KEY `Activity_dropletId_fkey`;

-- DropForeignKey
ALTER TABLE `Activity` DROP FOREIGN KEY `Activity_firewallId_fkey`;

-- DropForeignKey
ALTER TABLE `Activity` DROP FOREIGN KEY `Activity_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Droplet` DROP FOREIGN KEY `Droplet_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `TelegramNotification` DROP FOREIGN KEY `TelegramNotification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `VPS` DROP FOREIGN KEY `VPS_userId_fkey`;

-- DropIndex
DROP INDEX `Activity_dropletId_fkey` ON `Activity`;

-- DropIndex
DROP INDEX `Activity_firewallId_fkey` ON `Activity`;

-- DropIndex
DROP INDEX `Activity_userId_fkey` ON `Activity`;

-- DropIndex
DROP INDEX `Droplet_userId_fkey` ON `Droplet`;

-- DropIndex
DROP INDEX `TelegramNotification_userId_fkey` ON `TelegramNotification`;

-- DropIndex
DROP INDEX `Transaction_userId_fkey` ON `Transaction`;

-- DropIndex
DROP INDEX `VPS_userId_fkey` ON `VPS`;

-- AlterTable
ALTER TABLE `Activity` DROP COLUMN `createdAt`,
    DROP COLUMN `dropletId`,
    DROP COLUMN `firewallId`,
    ADD COLUMN `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `DigitalOceanToken` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Droplet` DROP COLUMN `cpu`,
    DROP COLUMN `digitalOceanId`,
    DROP COLUMN `disk`,
    DROP COLUMN `memory`,
    ADD COLUMN `doId` INTEGER NOT NULL,
    MODIFY `region` VARCHAR(191) NULL,
    MODIFY `size` VARCHAR(191) NULL,
    MODIFY `image` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Firewall` DROP COLUMN `digitalOceanId`,
    DROP COLUMN `inboundRules`,
    DROP COLUMN `outboundRules`,
    ADD COLUMN `doId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `FirewallDroplet` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Role` ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `description` TEXT NULL,
    MODIFY `permissions` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `maxServers` INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE `RoleServerTemplate` MODIFY `maxServers` INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE `ServerTemplate` ADD COLUMN `cpuCount` INTEGER NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `memoryGB` INTEGER NULL,
    ADD COLUMN `storageGB` INTEGER NULL,
    MODIFY `cpu` INTEGER NULL,
    MODIFY `ram` INTEGER NULL,
    MODIFY `disk` INTEGER NULL,
    MODIFY `price` DOUBLE NULL;

-- AlterTable
ALTER TABLE `TelegramNotification` DROP COLUMN `userId`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `message` TEXT NOT NULL,
    ADD COLUMN `sent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `type`,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `paymentId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `VPS` DROP COLUMN `digitalOceanId`,
    DROP COLUMN `size`,
    ADD COLUMN `cpu` INTEGER NULL,
    ADD COLUMN `disk` INTEGER NULL,
    ADD COLUMN `price` DOUBLE NULL,
    ADD COLUMN `ram` INTEGER NULL,
    ADD COLUMN `renewalDate` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    MODIFY `region` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Account`;

-- DropTable
DROP TABLE `Session`;

-- DropTable
DROP TABLE `User`;

-- DropTable
DROP TABLE `VerificationToken`;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `permissions` VARCHAR(191) NOT NULL DEFAULT '',
    `roleId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `DigitalOceanToken_token_key` ON `DigitalOceanToken`(`token`);

-- CreateIndex
CREATE UNIQUE INDEX `Droplet_doId_key` ON `Droplet`(`doId`);

-- CreateIndex
CREATE UNIQUE INDEX `Firewall_doId_key` ON `Firewall`(`doId`);

-- CreateIndex
CREATE UNIQUE INDEX `ServerRegion_name_key` ON `ServerRegion`(`name`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VPS` ADD CONSTRAINT `VPS_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Droplet` ADD CONSTRAINT `Droplet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
