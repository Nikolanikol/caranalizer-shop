import type { Metadata } from "next";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/container";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: "Политика конфиденциальности | Caranalizer",
    en: "Privacy Policy | Caranalizer",
    ar: "سياسة الخصوصية | Caranalizer",
  };
  return {
    title: titles[lang],
    robots: { index: false },
  };
}

export default function PrivacyPage() {
  const locale = useLocale();
  const isRu = locale === "ru";
  const isAr = locale === "ar";

  if (isAr) return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-8">سياسة الخصوصية</h1>
        <div className="prose prose-invert space-y-6 text-text-muted">
          <p>آخر تحديث: يونيو 2026</p>
          <p>يستخدم موقع Caranalizer (caranalizer.com) ملفات تعريف الارتباط وأدوات التحليل لتحسين تجربة المستخدم.</p>
          <h2 className="text-text text-xl font-semibold mt-6">ما الذي نجمعه</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Google Analytics — سلوك المستخدم وإحصاءات الزيارات</li>
            <li>Yandex Metrica — تحليل الجلسات والخرائط الحرارية</li>
            <li>Microsoft Clarity — تسجيلات الجلسات والخرائط الحرارية</li>
            <li>ملفات تعريف الارتباط المحلية — تفضيلات اللغة والعملة وسلة التسوق</li>
          </ul>
          <h2 className="text-text text-xl font-semibold mt-6">كيف نستخدم البيانات</h2>
          <p>نستخدم البيانات المجمعة فقط لتحسين الموقع وتجربة المستخدم. لا نبيع البيانات لأطراف ثالثة.</p>
          <h2 className="text-text text-xl font-semibold mt-6">التواصل</h2>
          <p>للاستفسارات: <a href="https://t.me/kmotors_bot" className="text-primary">Telegram</a></p>
        </div>
      </Container>
    </section>
  );

  if (isRu) return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-8">Политика конфиденциальности</h1>
        <div className="space-y-6 text-text-muted leading-relaxed">
          <p className="text-sm">Последнее обновление: июнь 2026</p>

          <p>Настоящая политика описывает, какие данные собирает сайт Caranalizer (caranalizer.com) и как они используются.</p>

          <h2 className="text-text text-xl font-semibold">Какие данные мы собираем</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-text">Google Analytics</strong> — статистика посещений, поведение пользователей на сайте</li>
            <li><strong className="text-text">Яндекс.Метрика</strong> — анализ сессий, тепловые карты, вебвизор</li>
            <li><strong className="text-text">Microsoft Clarity</strong> — записи сессий, тепловые карты кликов</li>
            <li><strong className="text-text">Локальные cookies</strong> — предпочтения языка, валюты и содержимое корзины</li>
          </ul>

          <h2 className="text-text text-xl font-semibold">Как мы используем данные</h2>
          <p>Собранные данные используются исключительно для улучшения работы сайта и пользовательского опыта. Мы не продаём и не передаём данные третьим лицам в маркетинговых целях.</p>

          <h2 className="text-text text-xl font-semibold">Cookies</h2>
          <p>Сайт использует cookies для сохранения ваших предпочтений (язык, валюта, корзина). Вы можете отключить cookies в настройках браузера, однако это может повлиять на работу некоторых функций сайта.</p>

          <h2 className="text-text text-xl font-semibold">Сторонние сервисы</h2>
          <p>Мы используем сторонние аналитические сервисы (Google, Яндекс, Microsoft), которые могут собирать данные в соответствии со своими политиками конфиденциальности. Рекомендуем ознакомиться с ними отдельно.</p>

          <h2 className="text-text text-xl font-semibold">Контакты</h2>
          <p>По вопросам обработки персональных данных: <a href="https://t.me/kmotors_bot" className="text-primary hover:underline">Telegram</a></p>
        </div>
      </Container>
    </section>
  );

  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-text-muted leading-relaxed">
          <p className="text-sm">Last updated: June 2026</p>

          <p>This policy describes what data Caranalizer (caranalizer.com) collects and how it is used.</p>

          <h2 className="text-text text-xl font-semibold">What we collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-text">Google Analytics</strong> — visit statistics, user behavior</li>
            <li><strong className="text-text">Yandex Metrica</strong> — session analysis, heatmaps, session recording</li>
            <li><strong className="text-text">Microsoft Clarity</strong> — session recordings, click heatmaps</li>
            <li><strong className="text-text">Local cookies</strong> — language, currency preferences and shopping cart</li>
          </ul>

          <h2 className="text-text text-xl font-semibold">How we use data</h2>
          <p>Collected data is used solely to improve the website and user experience. We do not sell or share data with third parties for marketing purposes.</p>

          <h2 className="text-text text-xl font-semibold">Cookies</h2>
          <p>The site uses cookies to store your preferences (language, currency, cart). You can disable cookies in your browser settings, though this may affect some site functionality.</p>

          <h2 className="text-text text-xl font-semibold">Third-party services</h2>
          <p>We use third-party analytics services (Google, Yandex, Microsoft) which may collect data according to their own privacy policies.</p>

          <h2 className="text-text text-xl font-semibold">Contact</h2>
          <p>For data privacy inquiries: <a href="https://t.me/kmotors_bot" className="text-primary hover:underline">Telegram</a></p>
        </div>
      </Container>
    </section>
  );
}
