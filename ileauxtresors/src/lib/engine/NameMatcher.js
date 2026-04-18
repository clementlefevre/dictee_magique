import levenshtein from 'js-levenshtein';
import prenoms from '$lib/data/prenoms.json';

const prenomValues = Object.values(prenoms);

export function matchPlayerName(inputName) {
  let nearestName = '';
  let minDistance = 10;

  for (const name of prenomValues) {
    const dist = levenshtein(name.toLowerCase(), inputName.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      nearestName = name;
    }
  }

  return nearestName || inputName;
}
