import { type Language, languages } from 'i18n/constants';
import { logger } from 'logger';

export class TranslateService {
  public async translate (text: string, language: string, languagefrom: Language = 'en'): Promise<string> {
    logger.debug(`[TranslateService][translate] ${language} <- ${text}`);
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${languagefrom}&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(text)}`);
    const translatedData = await response.json() as any;
    const translatedText = translatedData[0][0][0] as string;
    logger.debug(`[TranslateService][translate] ${language} -> ${JSON.stringify(translatedData)} -> ${translatedText}`);

    return translatedText;
  }

  public async translateToAll (text: string, languagefrom: Language = 'en'): Promise<Record<Language, string>> {
    const result: Record<Language, string> = {} as any;
    for (const language of languages) {
      if (language === languagefrom) {
        result[language] = text;
        continue;
      }
      result[language] = await this.translate(text, language, languagefrom);
    }
    return result;
  }
}
