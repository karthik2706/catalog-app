-- Update Role enum to use MASTER_ADMIN instead of SUPER_ADMIN
ALTER TYPE "public"."Role" RENAME VALUE 'SUPER_ADMIN' TO 'MASTER_ADMIN';
