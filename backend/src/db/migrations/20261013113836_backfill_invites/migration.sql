INSERT INTO "invites" ("user_id", "token")
SELECT u."id", replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
FROM "users" u
WHERE u."passwordHash" IS NULL
  AND u."deleted_at" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "invites" i WHERE i."user_id" = u."id");
