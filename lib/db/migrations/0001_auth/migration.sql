-- Create auth tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP,
  "image" TEXT,
  CONSTRAINT "user_pkey" PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "account" (
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "account_pkey" PRIMARY KEY("provider", "providerAccountId"),
  CONSTRAINT "account_userId_fkey" FOREIGN KEY("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "session" (
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY("sessionToken"),
  CONSTRAINT "session_userId_fkey" FOREIGN KEY("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "verificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  CONSTRAINT "verificationToken_pkey" PRIMARY KEY("identifier", "token")
);

-- Create index
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user"("email"); 