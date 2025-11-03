/**
 * HATEOAS Helper Functions
 * Extracts data from Spring HATEOAS responses
 */

// Type definitions for HATEOAS responses
interface HATEOASLink {
  href: string;
}

interface HATEOASLinks {
  [key: string]: HATEOASLink | HATEOASLink[];
  self?: HATEOASLink;
}

interface HATEOASEmbedded {
  studentResponseDtoList?: any[];
  responseClubDtoList?: any[];
  eventList?: any[];
  announcementList?: any[];
  [key: string]: any;
}

interface HATEOASResponse {
  _embedded?: HATEOASEmbedded;
  _links?: HATEOASLinks;
  [key: string]: any;
}

/**
 * Extract array data from HATEOAS _embedded structure
 * Handles different collection names used by the API
 */
export function extractCollection<T>(response: any): T[] {
  if (!response) return [];
  
  // If response is already an array, return it
  if (Array.isArray(response)) {
    return response;
  }

  // If response has _embedded, extract from it
  if (response._embedded) {
    const embedded = response._embedded as HATEOASEmbedded;
    
    // Try common collection names
    const collectionKeys = [
      'studentResponseDtoList',
      'responseClubDtoList',
      'eventList',
      'announcementList',
    ];

    for (const key of collectionKeys) {
      if (embedded[key] && Array.isArray(embedded[key])) {
        return embedded[key] as T[];
      }
    }

    // If no known key found, return first array value in _embedded
    const firstArrayValue = Object.values(embedded).find(
      (value) => Array.isArray(value)
    );
    if (firstArrayValue) {
      return firstArrayValue as T[];
    }
  }

  // If single entity, wrap in array
  if (response.id !== undefined) {
    return [response] as T[];
  }

  return [];
}

/**
 * Extract single entity from HATEOAS response
 * Removes _links and _embedded if present
 */
export function extractEntity<T>(response: any): T {
  if (!response) return response;

  // Clone to avoid mutating original
  const entity = { ...response };

  // Remove HATEOAS metadata
  delete (entity as any)._links;
  delete (entity as any)._embedded;

  return entity as T;
}

/**
 * Extract links from HATEOAS response
 */
export function extractLinks(response: any): HATEOASLinks | null {
  return response?._links || null;
}

/**
 * Get self link from HATEOAS response
 */
export function getSelfLink(response: any): string | null {
  const links = extractLinks(response);
  if (links?.self) {
    return typeof links.self === 'string' ? links.self : links.self.href;
  }
  return null;
}

