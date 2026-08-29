/** Зарегистрированный покупатель — строка `partsfit_customers`. */
export interface Customer {
  id: string;
  email: string;
  name: string;
  /** E.164 или пусто: у входа через Google телефона нет, спрашиваем его в кабинете. */
  phone: string;
  locale: string;
  /** 'google' или 'email' — как вошёл в последний раз. */
  provider: string;
  site: string;
  /** Согласие на письма о поступлениях. Отдельно от согласия на обработку данных. */
  marketingOk: boolean;
  createdAt: string;
}
