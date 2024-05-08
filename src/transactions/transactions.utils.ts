import { generate } from 'randomstring';

/**
 * Generate trx number
 * @returns
 */
export const generateTrxNumber = (): string => {
  return `GI-TX-${generate({
    length: 32,
    charset: 'alphanumeric',
    capitalization: 'uppercase',
  })}`;
};

/**
 * Compose course narration sentence
 * @param no
 * @returns
 */
export const courseNarration = (no: number): string => {
  const narrationTense = no > 1 ? `${no} courses` : `${no} course`;

  return `Payment for ${narrationTense}`;
};
