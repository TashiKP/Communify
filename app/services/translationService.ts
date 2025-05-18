// src/services/translationService.ts
import axios from 'axios';
import {Alert} from 'react-native';
import {API_BASE_MODEL_URL} from '../config/apiConfig';

const BATCH_TRANSLATE_API_URL = `${API_BASE_MODEL_URL}/batch-translate`;

interface BatchTranslateRequest {
  words: string[];
  target_language: 'en' | 'dzo';
}

interface BatchTranslateResponse {
  translated_words: string[];
}

export const translateKeywords = async (
  keywords: string[], // Original array of keywords from the app
  targetLanguage: 'en' | 'dzo',
): Promise<string[] | null> => {
  if (!keywords || keywords.length === 0) {
    console.log(
      'TranslationService: No keywords to translate, returning empty array.',
    );
    return [];
  }

  if (targetLanguage === 'en') {
    console.log(
      "TranslationService: Target language is 'en', returning original keywords.",
    );
    return [...keywords];
  }

  const keywordEntries: {original: string; index: number; isValid: boolean}[] =
    keywords.map((kw, index) => ({
      original: kw,
      index,
      isValid: !!(kw && kw.trim() !== ''), // Ensure boolean result
    }));

  const validKeywordsToTranslate = keywordEntries
    .filter(entry => entry.isValid)
    .map(entry => entry.original);

  if (validKeywordsToTranslate.length === 0) {
    console.log(
      'TranslationService: All keywords were empty/whitespace, returning original (empty) structure.',
    );
    return [...keywords];
  }

  const payload: BatchTranslateRequest = {
    words: validKeywordsToTranslate,
    target_language: targetLanguage,
  };

  console.log(
    `TranslationService: Calling API '${BATCH_TRANSLATE_API_URL}' for lang '${targetLanguage}' with ${validKeywordsToTranslate.length} valid words.`,
  );
  // console.log("TranslationService: Sending Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post<BatchTranslateResponse>(
      BATCH_TRANSLATE_API_URL,
      payload,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    if (
      response.data &&
      Array.isArray(response.data.translated_words) &&
      response.data.translated_words.length === validKeywordsToTranslate.length
    ) {
      const finalTranslations = [...keywords];
      let translatedIdx = 0;
      keywordEntries.forEach(entry => {
        if (entry.isValid) {
          if (translatedIdx < response.data.translated_words.length) {
            finalTranslations[entry.index] =
              response.data.translated_words[translatedIdx];
            translatedIdx++;
          } else {
            console.warn(
              `TranslationService: Mismatch in translated words received for valid keyword at original index ${entry.index}. Using original.`,
            );
            finalTranslations[entry.index] = entry.original;
          }
        }
      });
      return finalTranslations;
    } else {
      console.warn(
        'TranslationService: API response format invalid or length mismatch.',
        `Expected ${validKeywordsToTranslate.length} translations, got ${response.data?.translated_words?.length}. Response data:`,
        response.data,
      );
      Alert.alert(
        'Translation Error',
        'Received invalid translation data from the server. Please try again.',
      );
      return null;
    }
  } catch (error: any) {
    let errorMessage =
      'Could not translate words. Please check your connection and try again.';
    if (error.response) {
      console.error(
        'TranslationService: API Error Response Data:',
        error.response.data,
      );
      console.error(
        'TranslationService: API Error Response Status:',
        error.response.status,
      );
      if (error.response.data && error.response.data.detail) {
        errorMessage = `Translation failed: ${error.response.data.detail}`;
        if (
          Array.isArray(error.response.data.detail) &&
          error.response.data.detail[0]?.msg
        ) {
          errorMessage = `Translation failed: ${error.response.data.detail[0].msg}`;
        }
      } else if (error.response.status === 422) {
        errorMessage =
          'Translation failed due to invalid input. Please check the data.';
      }
    } else if (error.request) {
      console.error('TranslationService: API No Response:', error.request);
      errorMessage =
        'No response from translation server. Please check your network or try again later.';
    } else {
      console.error(
        'TranslationService: API Request Setup Error:',
        error.message,
      );
    }
    Alert.alert('Translation Error', errorMessage);
    return null;
  }
};
