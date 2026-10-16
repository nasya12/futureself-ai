# Görev dağılımı

> Aşağıdaki isimleri ve rolleri ekibinize göre doldurun. Her üye **kendi görevinin commit'lerini kendi GitHub hesabıyla** atmalı; bireysel katkı puanı (40) commit geçmişinden ve görev dağılımından okunur.

| Üye | Sorumluluk | Dosyalar | Örnek commit mesajı |
|---|---|---|---|
| Üye 1 — Web | Form, liste, tasarım, GitHub Pages | `index.html`, `fikir.html`, `auth.js`, `config.js` | `feat(web): kategori filtresi` |
| Üye 2 — n8n | Webhook, düğümler, hata yolları | `n8n/*.json` | `feat(n8n): hatalı girdi yanıtı` |
| Üye 3 — Veritabanı | Tablolar, RLS, örnek veri | `supabase/*.sql` | `feat(db): analiz tablosu` |
| Üye 4 — Yapay zekâ ve doküman | Prompt, JSON şeması, README, sunum | `docs/`, `README.md`, prompt | `docs: sunum notları` |

## Çalışma kuralları

- Küçük, anlamlı commit: `feat`, `fix`, `docs`, `chore` önekleri.
- Her görev için kısa dal (`feat/n8n-hata-yolu`) açıp `main`'e birleştirmek tercih edilir.
- Ortak dosya (`README.md`) değişmeden önce `git pull` yapılır.
- Herkes tüm akışı anlatabilmeli; sözlü soru bireyseldir.
