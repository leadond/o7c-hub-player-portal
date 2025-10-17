export const logosDataPromise = fetch('/collegeLogos.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('College logos data loaded successfully, length:', data.length);
    return data;
  })
  .catch(error => {
    console.error('Failed to load college logos data:', error);
    return null;
  });

// Normalize college names for better matching
function normalizeName(name) {
  return name.toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1, where 1 is perfect match)
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

function getCollegeLogo(logosData, schoolName) {
  if (!logosData) {
    console.log('getCollegeLogo called but logosData is null for:', schoolName);
    return null;
  }

  if (!schoolName || typeof schoolName !== 'string') {
    console.log('getCollegeLogo called with invalid schoolName:', schoolName);
    return null;
  }

  const normalizedInput = normalizeName(schoolName);
  console.log('getCollegeLogo called for:', schoolName, 'normalized:', normalizedInput);

  // First try exact match against main name
  let match = logosData.find(logo => normalizeName(logo.name) === normalizedInput);
  if (match) {
    console.log('Found exact match for:', schoolName, 'URL:', match.logo);
    return match.logo;
  }

  // Try exact match against alternative names
  match = logosData.find(logo =>
    logo.alternativeNames &&
    logo.alternativeNames.some(alt => normalizeName(alt) === normalizedInput)
  );
  if (match) {
    console.log('Found exact alternative match for:', schoolName, 'URL:', match.logo);
    return match.logo;
  }

  // Try partial matches against main name (only if input is significantly shorter)
  match = logosData.find(logo => {
    const logoNorm = normalizeName(logo.name);
    return logoNorm.includes(normalizedInput) && normalizedInput.length >= 3 && logoNorm.length > normalizedInput.length + 2;
  });
  if (match) {
    console.log('Found partial match for:', schoolName, 'URL:', match.logo);
    return match.logo;
  }

  // Try partial matches against alternative names (only if input is significantly shorter)
  match = logosData.find(logo =>
    logo.alternativeNames &&
    logo.alternativeNames.some(alt => {
      const altNorm = normalizeName(alt);
      return altNorm.includes(normalizedInput) && normalizedInput.length >= 3 && altNorm.length > normalizedInput.length + 2;
    })
  );
  if (match) {
    console.log('Found partial alternative match for:', schoolName, 'URL:', match.logo);
    return match.logo;
  }

  // Skip reverse partial matching for now as it causes false positives

  // Try word-based matching against main name (require at least 2 matching words)
  const inputWords = normalizedInput.split(' ');
  match = logosData.find(logo => {
    const logoWords = normalizeName(logo.name).split(' ');
    const matchingWords = inputWords.filter(word => logoWords.includes(word));
    return matchingWords.length >= 2;
  });
  if (match) {
    console.log('Found word-based match for:', schoolName, 'URL:', match.logo);
    return match.logo;
  }

  // Try word-based matching against alternative names (require at least 2 matching words)
  match = logosData.find(logo => {
    if (!logo.alternativeNames) return false;
    return logo.alternativeNames.some(alt => {
      const altWords = normalizeName(alt).split(' ');
      const matchingWords = inputWords.filter(word => altWords.includes(word));
      return matchingWords.length >= 2;
    });
  });
  if (match) {
    console.log('Found word-based alternative match for:', schoolName, 'URL:', match.logo);
    return match.logo;
  }

  // Fuzzy matching with similarity scoring against main name
  let bestMatch = null;
  let bestScore = 0;
  const similarityThreshold = 0.8; // Increased threshold for better accuracy

  for (const logo of logosData) {
    const normalizedLogoName = normalizeName(logo.name);
    const score = calculateSimilarity(normalizedInput, normalizedLogoName);

    if (score > bestScore && score >= similarityThreshold) {
      bestScore = score;
      bestMatch = logo;
    }
  }

  // Fuzzy matching against alternative names
  for (const logo of logosData) {
    if (!logo.alternativeNames) continue;

    for (const alt of logo.alternativeNames) {
      const normalizedAlt = normalizeName(alt);
      const score = calculateSimilarity(normalizedInput, normalizedAlt);

      if (score > bestScore && score >= similarityThreshold) {
        bestScore = score;
        bestMatch = logo;
      }
    }
  }

  if (bestMatch) {
    console.log('Found fuzzy match for:', schoolName, 'with score:', bestScore, 'URL:', bestMatch.logo);
    return bestMatch.logo;
  }

  console.log('No logo found for:', schoolName);
  return null;
}

function getOfficialName(logosData, schoolName) {
  if (!logosData) {
    console.log('getOfficialName called but logosData is null for:', schoolName);
    return schoolName; // Return original if no data
  }

  if (!schoolName || typeof schoolName !== 'string') {
    console.log('getOfficialName called with invalid schoolName:', schoolName);
    return schoolName;
  }

  const normalizedInput = normalizeName(schoolName);
  console.log('getOfficialName called for:', schoolName, 'normalized:', normalizedInput);

  // First try exact match against main name
  let match = logosData.find(logo => normalizeName(logo.name) === normalizedInput);
  if (match) {
    console.log('Found exact match for:', schoolName, 'official name:', match.name);
    return match.name;
  }

  // Try exact match against alternative names
  match = logosData.find(logo =>
    logo.alternativeNames &&
    logo.alternativeNames.some(alt => normalizeName(alt) === normalizedInput)
  );
  if (match) {
    console.log('Found exact alternative match for:', schoolName, 'official name:', match.name);
    return match.name;
  }

  // Try partial matches against main name (only if input is significantly shorter)
  match = logosData.find(logo => {
    const logoNorm = normalizeName(logo.name);
    return logoNorm.includes(normalizedInput) && normalizedInput.length >= 3 && logoNorm.length > normalizedInput.length + 2;
  });
  if (match) {
    console.log('Found partial match for:', schoolName, 'official name:', match.name);
    return match.name;
  }

  // Try partial matches against alternative names (only if input is significantly shorter)
  match = logosData.find(logo =>
    logo.alternativeNames &&
    logo.alternativeNames.some(alt => {
      const altNorm = normalizeName(alt);
      return altNorm.includes(normalizedInput) && normalizedInput.length >= 3 && altNorm.length > normalizedInput.length + 2;
    })
  );
  if (match) {
    console.log('Found partial alternative match for:', schoolName, 'official name:', match.name);
    return match.name;
  }

  // Try word-based matching against main name (require at least 2 matching words)
  const inputWords = normalizedInput.split(' ');
  match = logosData.find(logo => {
    const logoWords = normalizeName(logo.name).split(' ');
    const matchingWords = inputWords.filter(word => logoWords.includes(word));
    return matchingWords.length >= 2;
  });
  if (match) {
    console.log('Found word-based match for:', schoolName, 'official name:', match.name);
    return match.name;
  }

  // Try word-based matching against alternative names (require at least 2 matching words)
  match = logosData.find(logo => {
    if (!logo.alternativeNames) return false;
    return logo.alternativeNames.some(alt => {
      const altWords = normalizeName(alt).split(' ');
      const matchingWords = inputWords.filter(word => altWords.includes(word));
      return matchingWords.length >= 2;
    });
  });
  if (match) {
    console.log('Found word-based alternative match for:', schoolName, 'official name:', match.name);
    return match.name;
  }

  // Fuzzy matching with similarity scoring against main name
  let bestMatch = null;
  let bestScore = 0;
  const similarityThreshold = 0.8; // Increased threshold for better accuracy

  for (const logo of logosData) {
    const normalizedLogoName = normalizeName(logo.name);
    const score = calculateSimilarity(normalizedInput, normalizedLogoName);

    if (score > bestScore && score >= similarityThreshold) {
      bestScore = score;
      bestMatch = logo;
    }
  }

  // Fuzzy matching against alternative names
  for (const logo of logosData) {
    if (!logo.alternativeNames) continue;

    for (const alt of logo.alternativeNames) {
      const normalizedAlt = normalizeName(alt);
      const score = calculateSimilarity(normalizedInput, normalizedAlt);

      if (score > bestScore && score >= similarityThreshold) {
        bestScore = score;
        bestMatch = logo;
      }
    }
  }

  if (bestMatch) {
    console.log('Found fuzzy match for:', schoolName, 'with score:', bestScore, 'official name:', bestMatch.name);
    return bestMatch.name;
  }

  console.log('No official name found for:', schoolName, 'returning original');
  return schoolName; // Return original if no match
}

export { getCollegeLogo, getOfficialName };