export interface TextMatchOptions {
  useRegex: boolean;
  useWildcard: boolean;
  caseSensitive: boolean;
}

export class TextMatcher {
  /**
   * Matches text against a pattern with support for wildcards and regex
   */
  static matches(text: string, pattern: string, options: TextMatchOptions): boolean {
    if (!pattern.trim()) {
      return true; // Empty pattern matches everything
    }

    const searchText = options.caseSensitive ? text : text.toLowerCase();
    const searchPattern = options.caseSensitive ? pattern : pattern.toLowerCase();

    try {
      if (options.useRegex) {
        const flags = options.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchPattern, flags);
        return regex.test(searchText);
      } else if (options.useWildcard) {
        // Convert wildcard pattern to regex
        // Escape special regex characters except * and ?
        const escapedPattern = searchPattern
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')  // * matches any sequence of characters
          .replace(/\?/g, '.');  // ? matches any single character
        
        const flags = options.caseSensitive ? '' : 'i';
        const regex = new RegExp(`^${escapedPattern}$`, flags);
        return regex.test(searchText);
      } else {
        // Simple substring search
        return searchText.includes(searchPattern);
      }
    } catch (error) {
      // If regex is invalid, fall back to substring search
      console.warn('Invalid regex pattern, falling back to substring search:', error);
      return searchText.includes(searchPattern);
    }
  }

  /**
   * Validates if a regex pattern is valid
   */
  static isValidRegex(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }
}
