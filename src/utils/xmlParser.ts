/**
 * XML Parser Utility
 * Converts XML content to JavaScript objects, specifically for S3 bucket listings
 */

export function parseXmlToJson(xmlString: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML format: ' + parserError.textContent);
  }
  
  return xmlNodeToJson(xmlDoc.documentElement);
}

function xmlNodeToJson(node: Element): any {
  const obj: any = {};
  
  // Handle attributes
  if (node.attributes.length > 0) {
    obj['@attributes'] = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj['@attributes'][attr.nodeName] = attr.nodeValue;
    }
  }
  
  // Handle child nodes
  if (node.hasChildNodes()) {
    const children = Array.from(node.childNodes);
    
    // If only text content, return the text
    if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
      const textContent = children[0].textContent?.trim();
      return textContent || '';
    }
    
    // Process element children
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const nodeName = element.nodeName;
        const nodeValue = xmlNodeToJson(element);
        
        // Handle multiple elements with same name (convert to array)
        if (obj[nodeName]) {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
          }
          obj[nodeName].push(nodeValue);
        } else {
          obj[nodeName] = nodeValue;
        }
      }
    }
  }
  
  return obj;
}

/**
 * Transforms S3 XML structure to match the JSON format expected by service detection
 */
export function transformS3XmlToStandardFormat(xmlData: any): any {
  // Handle ListBucketResult wrapper (S3 XML response format)
  if (xmlData.ListBucketResult) {
    const result = xmlData.ListBucketResult;
    
    // Ensure Contents is always an array
    let contents = result.Contents;
    if (contents && !Array.isArray(contents)) {
      contents = [contents];
    }
    
    return {
      Name: result.Name || 'S3 Bucket',
      Contents: contents || [],
      ListBucketResult: result
    };
  }
  
  return xmlData;
}
