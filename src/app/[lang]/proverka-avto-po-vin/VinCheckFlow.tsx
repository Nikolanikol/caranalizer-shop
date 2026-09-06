"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VinDecoder } from "./VinDecoder";
import { CheckLeadForm } from "./CheckLeadForm";

/**
 * Один поток вместо двух форм: проверил номер бесплатно — тут же покупаешь отчёт.
 *
 * До 04.09.2026 это были две независимые формы на разных концах страницы, и человек,
 * получивший бесплатный результат, вводил тот же VIN второй раз, чтобы заплатить.
 * Лишний шаг стоял ровно там, где посетитель горячее всего.
 *
 * Состояние держится здесь, а не в декодере: номер нужен обоим — декодер его
 * проверяет, форма по нему продаёт. Прокинуть его вниз через страницу нельзя,
 * она серверная.
 *
 * Номер передаётся при любом ответе реестра, включая «не найдено» и запертый вход:
 * платный отчёт строится по другим базам (страховая история), и отсутствие машины
 * в реестре экспорта не значит, что покупать нечего.
 */
export function VinCheckFlow() {
  const t = useTranslations("report");
  const [checkedVin, setCheckedVin] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <VinDecoder onChecked={setCheckedVin} />

      {/* Якорь платного блока: на него ведут кнопка в герое и ссылка из таблицы
          сравнения. Он переехал внутрь потока, но адрес остался прежним. */}
      <div id="order" className="scroll-mt-24">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
            {t("formTitle")}
          </h2>
          <p className="text-text-secondary">{t("formSub")}</p>
        </div>
        <CheckLeadForm vin={checkedVin} />
      </div>
    </div>
  );
}
