type FieldPath = string | string[];

export function filterFields(data: any, fields: FieldPath[]): any {
  if (!data || !fields || fields.length === 0) {
    return data;
  }

  const result: any = {};

  fields.forEach(field => {
    const path = Array.isArray(field) ? field : field.split('.');
    let current = data;
    let target = result;

    // Navigate to the target field
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      
      // Handle wildcard
      if (key === '*') {
        if (Array.isArray(current)) {
          // Handle array wildcard
          current.forEach((item, index) => {
            if (!target[index]) {
              target[index] = {};
            }
            // Recursively process remaining path for each array item
            const remainingPath = path.slice(i + 1);
            if (remainingPath.length > 0) {
              const nestedResult = filterFields(item, [remainingPath.join('.')]);
              Object.assign(target[index], nestedResult);
            } else {
              target[index] = item;
            }
          });
        } else if (typeof current === 'object' && current !== null) {
          // Handle object wildcard
          Object.keys(current).forEach(key => {
            if (!target[key]) {
              target[key] = {};
            }
            // Recursively process remaining path for each object property
            const remainingPath = path.slice(i + 1);
            if (remainingPath.length > 0) {
              const nestedResult = filterFields(current[key], [remainingPath.join('.')]);
              Object.assign(target[key], nestedResult);
            } else {
              target[key] = current[key];
            }
          });
        }
        return;
      }

      if (!current[key]) {
        return; // Skip if path doesn't exist
      }
      current = current[key];
      
      // Create nested structure in result
      if (!target[key]) {
        target[key] = Array.isArray(current) ? [] : {};
      }
      target = target[key];
    }

    const lastKey = path[path.length - 1];
    
    // Handle arrays
    if (Array.isArray(current)) {
      if (!Array.isArray(target)) {
        target = [];
      }
      
      if (lastKey === '*') {
        // Copy entire array
        target.push(...current);
      } else {
        // Filter specific fields from array objects
        current.forEach((item, index) => {
          if (item[lastKey] !== undefined) {
            if (!target[index]) {
              target[index] = {};
            }
            target[index][lastKey] = item[lastKey];
          }
        });
      }
    } else {
      // Handle objects
      if (current[lastKey] !== undefined) {
        target[lastKey] = current[lastKey];
      }
    }
  });

  return result;
}

export function parseFieldPaths(fields: string[]): FieldPath[] {
  return fields.map(field => {
    // Handle array notation
    if (field.includes('[')) {
      const [base, index] = field.split('[');
      return [base, index.replace(']', '')];
    }
    return field;
  });
} 