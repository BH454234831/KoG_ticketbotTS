import { RequireParseWatch } from 'utils/RequireWatch';
import { z } from 'zod';

export const LocaleNameRegex = /[a-z]{2,}(?:_[A-Z]{2,})?/;

export const LocaleKeySchema = z.string().min(1);
export const LocalePluralSchema = z.number().int().min(0).max(6);
export const LocaleNameSchema = z.string().min(2).regex(LocaleNameRegex);

export const LocaleStringRecordSchema = z.record(LocaleNameSchema, z.string());
export const LocalePluralRecordSchema = z.record(LocaleNameSchema, z.record(LocalePluralSchema, z.string()));

export const LocaleRecordSchema = z.union([LocaleStringRecordSchema, LocalePluralRecordSchema]);
export type LocaleRecord = z.infer<typeof LocaleRecordSchema>;

export const LocaleRecordsSchema = z.record(LocaleKeySchema, LocaleRecordSchema);
export type LocaleRecords = z.infer<typeof LocaleRecordsSchema>;

export type I18nValues = Record<string, string | number | undefined>;

type ImplLocaleStringRecord<Langs extends string> = Record<Langs, string>;
type ImplLocalePruralRecordLangs<Langs extends string> = Record<Langs, Record<number, string>>;

type ImplLocaleRecord<Langs extends string = string> = ImplLocaleStringRecord<Langs> | ImplLocalePruralRecordLangs<Langs>;

type ImplLocaleRecords<Langs extends string = string, Keys extends string = string> = Record<Keys, ImplLocaleRecord<Langs>>;

export class I18n<Langs extends string = string, Keys extends string = string> {
  public readonly defaultLang: Langs;
  protected readonly _locales: RequireParseWatch<LocaleRecords> | LocaleRecords;

  public constructor (defaultLang: Langs, data: string | ImplLocaleRecords<Langs, Keys>) {
    this.defaultLang = defaultLang;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this._locales = typeof data === 'string' ? new RequireParseWatch(data, (l) => LocaleRecordsSchema.parse(l.default)) : data;
  }

  public get locales (): LocaleRecords {
    if (this._locales instanceof RequireParseWatch) {
      return this._locales.data;
    }

    return this._locales;
  }

  // Get the rule for pluralization
  // http://localization-guide.readthedocs.org/en/latest/l10n/pluralforms.html
  public get_rule (count: number, language: Langs): number {
    switch (language) {
      // nplurals=2; plural=(n > 1);
      case 'ach':
      case 'ak':
      case 'am':
      case 'arn':
      case 'br':
      case 'fil':
      case 'fr':
      case 'gun':
      case 'ln':
      case 'mfe':
      case 'mg':
      case 'mi':
      case 'oc':
      case 'pt_BR':
      case 'tg':
      case 'ti':
      case 'tr':
      case 'uz':
      case 'wa':
        return (count > 1) ? 1 : 0;

        // nplurals=2; plural=(n != 1);
      case 'af':
      case 'an':
      case 'anp':
      case 'as':
      case 'ast':
      case 'az':
      case 'bg':
      case 'bn':
      case 'brx':
      case 'ca':
      case 'da':
      case 'doi':
      case 'de':
      case 'el':
      case 'en':
      case 'eo':
      case 'es':
      case 'es_AR':
      case 'et':
      case 'eu':
      case 'ff':
      case 'fi':
      case 'fo':
      case 'fur':
      case 'fy':
      case 'gl':
      case 'gu':
      case 'ha':
      case 'he':
      case 'hi':
      case 'hne':
      case 'hu':
      case 'hy':
      case 'ia':
      case 'kl':
      case 'kn':
      case 'ku':
      case 'lb':
      case 'mai':
      case 'ml':
      case 'mn':
      case 'mni':
      case 'mr':
      case 'nah':
      case 'nap':
      case 'nb':
      case 'ne':
      case 'nl':
      case 'nn':
      case 'no':
      case 'nso':
      case 'or':
      case 'pa':
      case 'pap':
      case 'pms':
      case 'ps':
      case 'pt':
      case 'rm':
      case 'rw':
      case 'sat':
      case 'sco':
      case 'sd':
      case 'se':
      case 'si':
      case 'so':
      case 'son':
      case 'sq':
      case 'sv':
      case 'sw':
      case 'ta':
      case 'te':
      case 'tk':
      case 'ur':
      case 'yo':
        return (count !== 1) ? 1 : 0;

        // nplurals=1; plural=0;
      case 'ay':
      case 'bo':
      case 'cgg':
      case 'dz':
      case 'fa':
      case 'id':
      case 'ja':
      case 'jbo':
      case 'ka':
      case 'kk':
      case 'km':
      case 'ko':
      case 'ky':
      case 'lo':
      case 'ms':
      case 'my':
      case 'sah':
      case 'su':
      case 'th':
      case 'tt':
      case 'ug':
      case 'vi':
      case 'wo':
      case 'zh':
      case 'jv':
        return 0;

        // nplurals=2; plural=(n%10!=1 || n%100==11);
      case 'is':
        return (count % 10 !== 1 || count % 100 === 11) ? 1 : 0;

        // nplurals=4; plural=(n==1) ? 0 : (n==2) ? 1 : (n == 3) ? 2 : 3;
      case 'kw':
        return (count === 1) ? 0 : (count === 2) ? 1 : (count === 3) ? 2 : 3;

        // nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);
      case 'uk':
      case 'sr':
      case 'ru':
      case 'hr':
      case 'bs':
      case 'be':
        return count % 10 === 1 && count % 100 !== 11 ? 0 : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 1 : 2;

        // nplurals=3; plural=(n==0 ? 0 : n==1 ? 1 : 2);
      case 'mnk':
        return count === 0 ? 0 : count === 1 ? 1 : 2;

        // nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;
      case 'sk':
        return (count === 1) ? 0 : (count >= 2 && count <= 4) ? 1 : 2;

        // nplurals=3; plural=(n==1 ? 0 : (n==0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2);
      case 'ro':
        return count === 1 ? 0 : (count === 0 || (count % 100 > 0 && count % 100 < 20)) ? 1 : 2;

        // nplurals=6; plural=(n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5);
      case 'ar':
        return count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count % 100 >= 3 && count % 100 <= 10 ? 3 : count % 100 >= 11 ? 4 : 5;

        // nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;
      case 'cs':
        return count === 1 ? 0 : (count >= 2 && count <= 4) ? 1 : 2;

        // countplurals=3; plural=(n==1) ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;
      case 'csb':
        return (count === 1) ? 0 : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 1 : 2;

        // nplurals=4; plural=(n==1) ? 0 : (n==2) ? 1 : (n != 8 && n != 11) ? 2 : 3;
      case 'cy':
        return (count === 1) ? 0 : (count === 2) ? 1 : (count !== 8 && count !== 11) ? 2 : 3;

        // nplurals=5; plural=n==1 ? 0 : n==2 ? 1 : (n>2 && n<7) ? 2 :(n>6 && n<11) ? 3 : 4;
      case 'ga':
        return count === 1 ? 0 : count === 2 ? 1 : (count > 2 && count < 7) ? 2 : (count > 6 && count < 11) ? 3 : 4;

        // nplurals=4; plural=(n==1 || n==11) ? 0 : (n==2 || n==12) ? 1 : (n > 2 && n < 20) ? 2 : 3;
      case 'gd':
        return (count === 1 || count === 11) ? 0 : (count === 2 || count === 12) ? 1 : (count > 2 && count < 20) ? 2 : 3;

        // nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && (n%100<10 || n%100>=20) ? 1 : 2);
      case 'it':
        return count % 10 === 1 && count % 100 !== 11 ? 0 : count % 10 >= 2 && (count % 100 < 10 || count % 100 >= 20) ? 1 : 2;

        // nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n != 0 ? 1 : 2);
      case 'lv':
        return count % 10 === 1 && count % 100 !== 11 ? 0 : count !== 0 ? 1 : 2;

        // nplurals=2; plural= n==1 || n%10==1 ? 0 : 1;
      case 'mk':
        return count === 1 || count % 10 === 1 ? 0 : 1;

        // nplurals=4; plural=(n==1 ? 0 : n==0 || ( n%100>1 && n%100<11) ? 1 : (n%100>10 && n%100<20 ) ? 2 : 3);
      case 'mt':
        return count === 1 ? 0 : count === 0 || (count % 100 > 1 && count % 100 < 11) ? 1 : (count % 100 > 10 && count % 100 < 20) ? 2 : 3;

        // nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);
      case 'pl':
        return count === 1 ? 0 : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 1 : 2;

        // nplurals=4; plural=(n%100==1 ? 1 : n%100==2 ? 2 : n%100==3 || n%100==4 ? 3 : 0);
      case 'sl':
        return count % 100 === 1 ? 1 : count % 100 === 2 ? 2 : count % 100 === 3 || count % 100 === 4 ? 3 : 0;

      default:
        return 0;
    }
  }

  public _get (key: string, lang?: Langs): string | undefined {
    const val = this.locales[key]?.[lang ?? this.defaultLang] ?? this.locales[key]?.[this.defaultLang];
    if (val == null) return undefined;
    if (typeof val !== 'string') return undefined;
    return val;
  }

  public get (key: Keys, lang?: Langs): string {
    return this._get(key, lang) ?? key;
  }

  public _getPlural (key: string, rule: number, lang?: Langs): string | undefined {
    const val = this.locales[key]?.[lang ?? this.defaultLang] ?? this.locales[key]?.[this.defaultLang];
    if (val == null) return undefined;
    if (typeof val !== 'object') return undefined;
    return val[rule];
  }

  public __impl (str: string, values?: I18nValues, lang?: Langs): string {
    // if lang is passed then use it, else use the default lang
    if (lang == null) {
      lang = this.defaultLang;
    }

    // return translation of the original sting if did not find the translation
    let translation = str;

    const matches = translation.match(/{{(?:[^{}|]+?)(?:\|\|(?:[^{}|]+))?}}/g);
    if (matches != null) {
      matches.forEach((match, index) => {
        // get the word in the match example
        const matchWord = match.substring(2, match.length - 2);

        // translate the word if was passed in the values var
        if (values?.[matchWord] != null) {
          translation = translation.replace(match, String(values[matchWord]));
          return;
        }
        {
          const trans = this._get(matchWord, lang);
          if (trans != null) {
            translation = translation.replace(match, trans);
            return;
          }
        }

        // if the matched word have a count
        if (matchWord.includes('||') && values != null) {
          const tempArray = matchWord.split('||');
          // update the matched word
          const _matchWord = tempArray[0]!;
          // get the variable of the count for the word
          const itemCountVariable = tempArray[1]!;

          // get the value form values passed to this function
          const itemCount = Number(values[itemCountVariable]);
          if (!Number.isNaN(itemCount)) {
            // will get the rule or for pluralization based on the lang
            const rule = this.get_rule(itemCount, lang);

            const trans = this._getPlural(_matchWord, rule, lang) ?? this._get(_matchWord, lang);
            if (trans != null) {
              translation = translation.replace(match, trans);
            }
          }
        }
        // else {
        //   if (values != null) {
        //     translation = translation.replace(match, values[_matchWord]);
        //   } else {
        //     translation = translation.replace(match, this.locale[_matchWord][lang]);
        //   }
        // }
      });
    }

    return translation;
  }

  public __ (str: string, values?: I18nValues, lang?: Langs): string {
    let translation = str;
    // If the string have place to render values within
    while ((/{{[^{}]+}}/g).test(translation)) {
      const newTranslation = this.__impl(translation, values, lang);
      if (newTranslation === translation) break;
      translation = newTranslation;
    }
    return translation;
  }
}
