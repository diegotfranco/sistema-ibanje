import { zxcvbnAsync, zxcvbnOptions, type ZxcvbnResult } from '@zxcvbn-ts/core';
import { matcherPwnedFactory } from '@zxcvbn-ts/matcher-pwned';

let initialized = false;

async function initZxcvbn() {
  if (initialized) return;
  initialized = true;

  const [common, en, ptBr] = await Promise.all([
    import('@zxcvbn-ts/language-common'),
    import('@zxcvbn-ts/language-en'),
    import('@zxcvbn-ts/language-pt-br')
  ]);

  zxcvbnOptions.setOptions({
    dictionary: {
      ...common.dictionary,
      ...en.dictionary,
      ...ptBr.dictionary
    },
    graphs: common.adjacencyGraphs,
    translations: { ...en.translations, ...ptBr.translations },
    useLevenshteinDistance: true,
    maxLength: 64
  });

  const pwned = matcherPwnedFactory(fetch, zxcvbnOptions);
  zxcvbnOptions.addMatcher('pwned', pwned);
}

/**
 * Evaluate a password’s strength (async version, uses matchers like “pwned”).
 */
export async function checkPasswordStrength(
  password: string,
  userInputs: string[] = []
): Promise<ZxcvbnResult> {
  await initZxcvbn();

  const [name = '', email = ''] = userInputs;

  // Split name into words (by spaces, multiple or single)
  const nameParts = name.trim().split(/\s+/).filter(Boolean);

  // Extract part of email before "@"
  const emailPrefix = email.includes('@') ? email.split('@')[0] : email;

  // Combine all for zxcvbn contextual checking
  const inputsForMatcher = [...nameParts, emailPrefix];

  // Optionally log for debugging
  console.log('Password check:', { password, inputsForMatcher });

  // Use async version for pwned + advanced matchers
  return await zxcvbnAsync(password, inputsForMatcher);
}
