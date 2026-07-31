-- Cada história nova publicada pode notificar doadores (sem esperar 2h).
UPDATE push_rules
SET cooldown_minutos = 0, updated_at = NOW()
WHERE gatilho = 'historia_sucesso_publicada';
