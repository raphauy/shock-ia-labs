-- Agregar campo prompt a la tabla user
ALTER TABLE "user" ADD COLUMN "prompt" text DEFAULT 'Eres un asistente amigable! Mantén tus respuestas concisas y útiles.'; 