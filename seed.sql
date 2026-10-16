-- İsteğe bağlı: liste ilk açılışta boş görünmesin diye 2 örnek kayıt.
-- Gerçek kayıtlardan ayırt edilsin diye takma adlar "Örnek" ile başlar.
with i as (
  insert into public.ideas (nickname, idea_text, stage) values
   ('Örnek Ayşe', 'Köy okullarındaki öğrencilere internet olmadan çalışan, telefonda açılan matematik soru bankası uygulaması.', 'fikir'),
   ('Örnek Zeynep', 'Üniversite kantinlerinde artan yemekleri akşam indirimli satışa çıkaran QR kodlu bir sistem.', 'prototip')
  returning id, nickname
)
insert into public.idea_analyses (idea_id, category, summary, score, score_reason, risks, next_steps, ai_model)
select id,
  case when nickname='Örnek Ayşe' then 'egitim' else 'sosyal' end,
  case when nickname='Örnek Ayşe' then 'İnternetsiz çalışan mobil soru bankası; erişim sorununa doğrudan çözüm.'
       else 'Gıda israfını azaltan, öğrenciye indirim sağlayan QR tabanlı satış sistemi.' end,
  case when nickname='Örnek Ayşe' then 7 else 6 end,
  'Sorun net ve hedef kitle belli; gelir modeli henüz belirsiz.',
  '["Soru içeriğini hazırlamak zaman alır","Okullarla ilk temas zor olabilir","Gelir modeli belirsiz"]'::jsonb,
  '["10 öğrenciyle kâğıt prototip testi yap","Müfredata uygun 50 soruluk ilk paket hazırla","Bir öğretmenle görüşüp geri bildirim al"]'::jsonb,
  'örnek'
from i;
