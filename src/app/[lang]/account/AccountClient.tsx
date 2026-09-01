'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Check, Loader2, LogOut } from 'lucide-react';
import type { Value } from 'react-phone-number-input';
import { useAuth } from '@/components/auth/auth-context';
import type { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { SHOP_BASE } from '@/lib/shop/urls';
import { VinHistory } from './VinHistory';

/**
 * Кабинет. Пока в нём только контакты покупателя — заявки к аккаунту не привязаны:
 * таблица `leads` общая с kmotors, колонки пользователя в ней нет, и заводить её
 * в чужой таблице ради одного экрана незачем.
 *
 * Главное здесь — телефон. У входа через Google его нет вовсе, а менеджеру звонить
 * по чему-то надо, поэтому пустое поле подписано просьбой, а не молчит.
 */
export function AccountClient() {
  const locale = useLocale() === 'en' ? 'en' : 'ru';
  const t = TEXT[locale];
  const router = useRouter();
  const { user, customer, loading, refresh, saveProfile, signOut } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState<Value>();
  const [marketingOk, setMarketingOk] = useState(false);
  const [ready, setReady] = useState(false);
  /** Выход уже нажат: сторож ниже не должен перехватить его на форму входа. */
  const [leaving, setLeaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  /*
   * Вошедшего нет — форме входа передаём, куда вернуть. Кроме случая, когда человек
   * сам нажал «Выйти»: тогда его ждёт главная, а не предложение войти обратно.
   */
  useEffect(() => {
    if (!loading && !user && !leaving) router.replace('/auth?next=%2Faccount');
  }, [loading, user, leaving, router]);

  useEffect(() => {
    if (!user) return;
    void refresh().finally(() => setReady(true));
    // refresh стабилен между рендерами, но зависимость от него зациклила бы эффект:
    // он же и обновляет customer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /*
   * Форма заполняется тем, что вернул сервер. Сравнением при рендере, а не эффектом:
   * это рекомендованный React способ подстроить состояние под изменившийся вход,
   * и он не даёт лишнего прохода с пустыми полями поверх уже загруженного профиля.
   */
  const [filledFrom, setFilledFrom] = useState<Customer | null>(null);
  if (customer && customer !== filledFrom) {
    setFilledFrom(customer);
    setName(customer.name);
    setPhone((customer.phone || undefined) as Value | undefined);
    setMarketingOk(customer.marketingOk);
  }

  if (loading || !user) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    const result = await saveProfile({ name, phone: phone ?? '', marketingOk, locale });
    setSaving(false);
    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(t.saveFailed);
    }
  };

  return (
    <>
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h1 className="mb-1 text-xl font-bold text-text">{t.title}</h1>
      <p className="mb-6 text-sm text-text-secondary">{user.email}</p>

      {!ready ? (
        <div className="h-48 animate-pulse rounded-lg bg-elevated" />
      ) : (
        <form onSubmit={save} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">{t.name}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} autoComplete="name" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">{t.phone}</span>
            <PhoneInput value={phone} onChange={setPhone} placeholder={t.phonePlaceholder} />
            {!phone && <span className="mt-1.5 block text-xs text-text-dim">{t.phoneHint}</span>}
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={marketingOk}
              onChange={(e) => setMarketingOk(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span>{t.marketing}</span>
          </label>

          {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saved && <Check className="h-4 w-4" />}
            {saved ? t.saved : t.save}
          </Button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
        <Link href={SHOP_BASE} className="text-sm font-medium text-primary hover:underline">
          {t.toCatalog}
        </Link>
        <button
          type="button"
          onClick={() => {
            setLeaving(true);
            void signOut().then(() => router.replace('/'));
          }}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          {t.signOut}
        </button>
      </div>
    </div>

    <VinHistory locale={locale} />
    </>
  );
}

const TEXT = {
  ru: {
    title: 'Личный кабинет',
    name: 'Имя',
    namePlaceholder: 'Как к вам обращаться',
    phone: 'Телефон',
    phonePlaceholder: '+7 999 000-00-00',
    phoneHint: 'Оставьте номер — менеджер ответит по заявке быстрее, чем письмом.',
    marketing: 'Присылать письма о поступлении запчастей и скидках.',
    save: 'Сохранить',
    saved: 'Сохранено',
    saveFailed: 'Не удалось сохранить. Попробуйте ещё раз.',
    signOut: 'Выйти',
    toCatalog: 'В каталог запчастей',
  },
  en: {
    title: 'Your account',
    name: 'Name',
    namePlaceholder: 'What should we call you',
    phone: 'Phone',
    phonePlaceholder: '+1 555 000 0000',
    phoneHint: 'Leave a number — the manager will get back to you faster than by email.',
    marketing: 'Email me when parts arrive and about discounts.',
    save: 'Save',
    saved: 'Saved',
    saveFailed: 'Could not save. Please try again.',
    signOut: 'Sign out',
    toCatalog: 'Browse parts',
  },
} as const;
