'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import type { Value } from 'react-phone-number-input';
import { getAuthClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { trackLogin, trackSignUp } from '@/lib/analytics';

/**
 * Вход и регистрация. Четыре режима в одной форме: вход, регистрация, «забыли пароль»
 * и ввод нового пароля по ссылке из письма.
 *
 * Регистрация нужна не сама по себе — она ловит почту покупателя. Из корзины к нам
 * приходят имя и телефон, почты нет нигде, и написать клиенту о поступлении нечем.
 * Поэтому Google стоит первым: он даёт подтверждённый адрес в один клик и не зависит
 * от того, дошло ли письмо.
 *
 * Телефон в форме необязателен намеренно. Обязательным он удвоил бы отказ от
 * регистрации, а спросить его есть где — в кабинете и в заявке из корзины.
 */

type Mode = 'login' | 'register' | 'forgot' | 'reset';

/** Куда вернуть после входа. Только внутренний путь: `//чужой.сайт` — открытый редирект. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

const MODES: Mode[] = ['login', 'register', 'forgot', 'reset'];

export function AuthForm() {
  const locale = useLocale() === 'en' ? 'en' : 'ru';
  const t = TEXT[locale];
  const router = useRouter();

  /*
   * Режим и адрес возврата читаются в браузере, а не из `searchParams` страницы:
   * страница с `searchParams` становится динамической, а держать её статикой дешевле —
   * форма одна и та же при любых параметрах.
   */
  const params = useSearchParams();
  const requested = params.get('mode') as Mode | null;
  const next = params.get('next');

  const [mode, setMode] = useState<Mode>(requested && MODES.includes(requested) ? requested : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<Value>();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [marketingOk, setMarketingOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /**
   * Включён ли Google в этом GoTrue. `null` — ещё не спросили.
   *
   * Спрашиваем, потому что `signInWithOAuth` не проверяет ничего: он просто уводит
   * браузер на `/auth/v1/authorize`, и при выключенном провайдере человек видит
   * голый JSON «Unsupported provider» вместо страницы входа. На локальном стеке
   * провайдера нет вовсе, а на проде так выглядела бы любая правка настроек GoTrue.
   */
  const [googleReady, setGoogleReady] = useState<boolean | null>(null);
  /** Экран «письмо отправлено»: и после регистрации, и после запроса нового пароля. */
  const [sent, setSent] = useState<'confirm' | 'reset' | null>(null);

  const destination = safeNext(next);

  /*
   * Уже вошедшему форма не нужна. Случай не выдуманный: по ссылке «Войти» из шапки
   * попадают и те, у кого сессия жива, — а браузер помнит её месяцами.
   */
  useEffect(() => {
    if (mode === 'reset') return;
    getAuthClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace(destination);
      });
  }, [mode, destination, router]);

  useEffect(() => {
    let alive = true;
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    })
      .then((response) => response.json())
      .then((settings) => {
        if (alive) setGoogleReady(Boolean(settings?.external?.google));
      })
      .catch(() => {
        // GoTrue не ответил — кнопку не прячем: пусть человек попробует.
        if (alive) setGoogleReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  /** Сообщения GoTrue приходят по-английски — переводим те, что видит человек. */
  const explain = (message: string): string => {
    const text = message.toLowerCase();
    if (text.includes('invalid login credentials')) return t.errInvalid;
    if (text.includes('email not confirmed')) return t.errNotConfirmed;
    if (text.includes('already registered')) return t.errTaken;
    if (text.includes('password should be')) return t.errWeak;
    if (text.includes('rate limit') || text.includes('too many')) return t.errRate;
    if (text.includes('redirect')) return t.errRedirect;
    return message;
  };

  const withGoogle = async () => {
    setBusy(true);
    setError('');
    const { error: failure } = await getAuthClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Возврат строго на наш домен и на наш язык. Адрес обязан быть в списке
        // разрешённых у GoTrue, иначе он молча вернёт человека на site_url — то есть
        // на kmotors.
        redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(destination)}`,
      },
    });
    if (failure) {
      setError(explain(failure.message));
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (mode === 'register' && !consent) return;
    if (mode === 'reset' && password !== password2) {
      setError(t.errMismatch);
      return;
    }

    setBusy(true);
    const supabase = getAuthClient();

    try {
      if (mode === 'login') {
        const { error: failure } = await supabase.auth.signInWithPassword({ email, password });
        if (failure) throw failure;
        trackLogin('email');
        router.replace(destination);
        return;
      }

      if (mode === 'register') {
        const { data, error: failure } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Имя, телефон и согласие на рассылку кладём в метаданные пользователя:
            // строку в `partsfit_customers` заводит сервер после первого входа,
            // а при подтверждении почты между регистрацией и входом проходит время.
            data: { name: name.trim(), phone: phone ?? '', locale, marketingOk },
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        });
        if (failure) throw failure;

        trackSignUp('email');
        // Сессия сразу — только если подтверждение почты выключено. Иначе человек
        // ждёт письма, и обещать ему вход нельзя.
        if (data.session) router.replace(destination);
        else setSent('confirm');
        return;
      }

      if (mode === 'forgot') {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/${locale}/auth?mode=reset`,
        });
        if (failure) throw failure;
        setSent('reset');
        return;
      }

      // mode === 'reset': сюда попадают по ссылке из письма, сессия восстановления
      // уже подхвачена клиентом из адреса.
      const { error: failure } = await supabase.auth.updateUser({ password });
      if (failure) throw failure;
      router.replace('/account');
    } catch (failure) {
      setError(explain(failure instanceof Error ? failure.message : String(failure)));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
        <MailCheck className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="mb-2 text-lg font-semibold text-text">{t.sentTitle}</h2>
        <p className="text-sm text-text-secondary">
          {sent === 'confirm' ? t.sentConfirm : t.sentReset} <b className="text-text">{email}</b>
        </p>
        <p className="mt-3 text-sm text-text-dim">{t.sentSpam}</p>
      </div>
    );
  }

  const title = mode === 'login' ? t.login : mode === 'register' ? t.register : mode === 'forgot' ? t.forgotTitle : t.resetTitle;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h1 className="mb-1 text-xl font-bold text-text">{title}</h1>
      <p className="mb-6 text-sm text-text-secondary">
        {mode === 'register' ? t.registerLead : mode === 'login' ? t.loginLead : mode === 'forgot' ? t.forgotLead : t.resetLead}
      </p>

      {(mode === 'login' || mode === 'register') && (
        <>
          <button
            type="button"
            onClick={withGoogle}
            disabled={busy || googleReady === false}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-elevated text-sm font-semibold text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleMark />
            {t.google}
          </button>
          {googleReady === false ? (
            <p className="mt-2 text-center text-xs text-text-dim">{t.googleOff}</p>
          ) : (
            /*
             * Согласие у входа через Google собрать галочкой нельзя — человек уходит
             * на сторону Google по первому же клику, и формы, где её ставить, он
             * не видит. Поэтому оговорка действием: она обязана стоять до кнопки
             * по смыслу, но после неё по вёрстке — иначе кнопка перестаёт быть первой
             * вещью на экране, ради которой мы её первой и поставили.
             */
            <p className="mt-2 text-center text-xs text-text-dim">
              {t.googleConsentBefore}{' '}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-text-secondary">
                {t.consentPolicy}
              </Link>
              {t.consentAfter}
            </p>
          )}
          <div className="my-5 flex items-center gap-3 text-xs text-text-dim">
            <span className="h-px flex-1 bg-border-subtle" />
            {t.or}
            <span className="h-px flex-1 bg-border-subtle" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <Field label={t.name} hint={t.optional}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} autoComplete="name" />
          </Field>
        )}

        {mode !== 'reset' && (
          <Field label={t.email}>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
        )}

        {mode === 'register' && (
          <Field label={t.phone} hint={t.optional}>
            <PhoneInput value={phone} onChange={setPhone} placeholder={t.phonePlaceholder} />
          </Field>
        )}

        {mode !== 'forgot' && (
          <Field label={mode === 'reset' ? t.newPassword : t.password}>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="pe-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-text-dim hover:text-text"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        )}

        {mode === 'reset' && (
          <Field label={t.confirmPassword}>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        )}

        {mode === 'register' && (
          <div className="space-y-3 pt-1">
            <label className="flex cursor-pointer items-start gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                {t.consentBefore}{' '}
                <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
                  {t.consentPolicy}
                </Link>
                {t.consentAfter}
              </span>
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
          </div>
        )}

        {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full" size="lg">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'login' ? t.login : mode === 'register' ? t.registerSubmit : mode === 'forgot' ? t.forgotSubmit : t.resetSubmit}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-text-secondary">
        {mode === 'login' && (
          <>
            <p>
              <button type="button" onClick={() => setMode('forgot')} className="text-primary hover:underline">
                {t.forgotLink}
              </button>
            </p>
            <p>
              {t.noAccount}{' '}
              <button type="button" onClick={() => setMode('register')} className="font-semibold text-primary hover:underline">
                {t.register}
              </button>
            </p>
          </>
        )}
        {mode === 'register' && (
          <p>
            {t.hasAccount}{' '}
            <button type="button" onClick={() => setMode('login')} className="font-semibold text-primary hover:underline">
              {t.login}
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
              {t.backToLogin}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-text">
        {label}
        {hint && <span className="text-xs font-normal text-text-dim">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Логотип Google. Инлайном: внешние картинки в кнопку входа тянуть незачем. */
function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 41.2 44 36 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

const TEXT = {
  ru: {
    login: 'Войти',
    loginLead: 'Войдите, чтобы видеть свои заявки и не вводить данные заново.',
    register: 'Регистрация',
    registerLead: 'Аккаунт нужен, чтобы мы сообщили о поступлении нужной детали и чтобы не заполнять форму каждый раз.',
    registerSubmit: 'Создать аккаунт',
    google: 'Продолжить с Google',
    googleOff: 'Вход через Google на этом сервере не настроен — зарегистрируйтесь по почте.',
    googleConsentBefore: 'Продолжая через Google, вы соглашаетесь с',
    or: 'или',
    name: 'Имя',
    namePlaceholder: 'Как к вам обращаться',
    optional: 'необязательно',
    email: 'Электронная почта',
    phone: 'Телефон',
    phonePlaceholder: 'Для связи по заявке',
    password: 'Пароль',
    passwordPlaceholder: 'Минимум 6 символов',
    newPassword: 'Новый пароль',
    confirmPassword: 'Ещё раз',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    consentBefore: 'Согласен на обработку персональных данных в соответствии с',
    consentPolicy: 'политикой',
    consentAfter: '.',
    marketing: 'Присылать письма о поступлении запчастей и скидках. Отписаться можно в любой момент.',
    forgotLink: 'Забыли пароль?',
    forgotTitle: 'Восстановление пароля',
    forgotLead: 'Введите почту — пришлём ссылку для смены пароля.',
    forgotSubmit: 'Прислать ссылку',
    resetTitle: 'Новый пароль',
    resetLead: 'Придумайте пароль для входа.',
    resetSubmit: 'Сохранить пароль',
    backToLogin: 'Вернуться ко входу',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    sentTitle: 'Письмо отправлено',
    sentConfirm: 'Подтвердите адрес по ссылке из письма на',
    sentReset: 'Ссылка для смены пароля отправлена на',
    sentSpam: 'Если письма нет через пару минут — проверьте папку «Спам».',
    errInvalid: 'Неверная почта или пароль.',
    errNotConfirmed: 'Адрес не подтверждён — откройте ссылку из письма.',
    errTaken: 'Такая почта уже зарегистрирована. Войдите или восстановите пароль.',
    errWeak: 'Пароль короче шести символов.',
    errRate: 'Слишком много попыток. Попробуйте через несколько минут.',
    errMismatch: 'Пароли не совпадают.',
    errRedirect: 'Вход через Google пока не настроен для этого домена. Напишите нам, мы починим.',
  },
  en: {
    login: 'Sign in',
    loginLead: 'Sign in to see your requests and skip filling the form again.',
    register: 'Create account',
    registerLead: 'An account lets us tell you when the part you need arrives — and saves you filling the form every time.',
    registerSubmit: 'Create account',
    google: 'Continue with Google',
    googleOff: 'Google sign-in is not configured on this server — please register by email.',
    googleConsentBefore: 'By continuing with Google you agree to the',
    or: 'or',
    name: 'Name',
    namePlaceholder: 'What should we call you',
    optional: 'optional',
    email: 'Email',
    phone: 'Phone',
    phonePlaceholder: 'So we can reach you about the order',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    newPassword: 'New password',
    confirmPassword: 'Repeat',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    consentBefore: 'I agree to the processing of my personal data in line with the',
    consentPolicy: 'privacy policy',
    consentAfter: '.',
    marketing: 'Email me when parts arrive and about discounts. You can unsubscribe any time.',
    forgotLink: 'Forgot your password?',
    forgotTitle: 'Reset password',
    forgotLead: 'Enter your email and we will send a reset link.',
    forgotSubmit: 'Send the link',
    resetTitle: 'New password',
    resetLead: 'Choose a password for your account.',
    resetSubmit: 'Save password',
    backToLogin: 'Back to sign in',
    noAccount: 'No account yet?',
    hasAccount: 'Already have an account?',
    sentTitle: 'Check your inbox',
    sentConfirm: 'Confirm your address with the link we sent to',
    sentReset: 'A password reset link is on its way to',
    sentSpam: 'No email after a couple of minutes? Check the spam folder.',
    errInvalid: 'Wrong email or password.',
    errNotConfirmed: 'Address not confirmed — open the link from the email first.',
    errTaken: 'That email is already registered. Sign in or reset the password.',
    errWeak: 'Password is shorter than six characters.',
    errRate: 'Too many attempts. Try again in a few minutes.',
    errMismatch: 'Passwords do not match.',
    errRedirect: 'Google sign-in is not configured for this domain yet. Drop us a line and we will fix it.',
  },
} as const;
