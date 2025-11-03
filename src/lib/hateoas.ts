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
  if (!response) {
    console.warn('⚠️ extractCollection: response is null/undefined');
    return [];
  }
  
  // Strategy 1: Response is already an array
  if (Array.isArray(response)) {
    console.log('✅ extractCollection: Response is direct array, length:', response.length);
    return response;
  }

  // Strategy 2: Response has _embedded (Spring HATEOAS CollectionModel)
  if (response._embedded) {
    const embedded = response._embedded as HATEOASEmbedded;
    console.log('📦 extractCollection: Found _embedded, keys:', Object.keys(embedded));
    
    // Try common collection names (Spring HATEOAS CollectionModel)
    const collectionKeys = [
      'studentResponseDtoList',
      'responseClubDtoList',
      'eventList',
      'announcementList',
      'authorityList',
      'feeList',
      'pendingRequestGetterDtoList',
      // Also try camelCase variations
      'students',
      'clubs',
      'events',
      'announcements',
      'authorities',
      'fees',
    ];

    for (const key of collectionKeys) {
      if (embedded[key] && Array.isArray(embedded[key])) {
        console.log(`✅ extractCollection: Found collection in _embedded.${key}:`, embedded[key].length, 'items');
        return embedded[key] as T[];
      }
    }

    // Strategy 3: If no known key found, return first array value in _embedded
    const firstArrayValue = Object.values(embedded).find(
      (value) => Array.isArray(value)
    );
    if (firstArrayValue) {
      console.log('✅ extractCollection: Using first array in _embedded, length:', firstArrayValue.length);
      return firstArrayValue as T[];
    }
    
    console.warn('⚠️ extractCollection: _embedded exists but no array found. Keys:', Object.keys(embedded));
  }

  // Strategy 4: Response might have content property (Spring Data pagination)
  if (response.content && Array.isArray(response.content)) {
    console.log('✅ extractCollection: Found content array, length:', response.content.length);
    return response.content as T[];
  }

  // Strategy 5: Check if response has array-like properties
  const arrayKeys = Object.keys(response).filter(key => Array.isArray(response[key]));
  if (arrayKeys.length > 0) {
    console.log('✅ extractCollection: Found array property:', arrayKeys[0], 'length:', response[arrayKeys[0]].length);
    return response[arrayKeys[0]] as T[];
  }

  // Strategy 6: If single entity, wrap in array
  if (response.id !== undefined) {
    console.log('✅ extractCollection: Single entity found, wrapping in array');
    return [response] as T[];
  }

  console.warn('⚠️ extractCollection: No collection found. Response structure:', {
    hasEmbedded: !!response._embedded,
    keys: Object.keys(response),
    isArray: Array.isArray(response),
    sample: JSON.stringify(response).substring(0, 200)
  });
  
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

