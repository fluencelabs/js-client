/**
 * @typedef {import("@fluencelabs/js-client").NonArrowSimpleType} NonArrowSimpleType
 * @typedef {import("@fluencelabs/js-client").JSONValue} JSONValue
 */

/**
 * Convert value from its representation in aqua language to representation in typescript
 * @param {JSONValue} value - value as represented in aqua
 * @param {NonArrowSimpleType} schema - definition of the aqua schema
 * @returns {JSONValue} value represented in typescript
 */
export function aqua2ts(value, schema) {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    if (value.length === 0) {
      return null;
    } else {
      return aqua2ts(value[0], schema.type);
    }
  } else if (
    schema.tag === "scalar" ||
    schema.tag === "bottomType" ||
    schema.tag === "topType"
  ) {
    return value;
  } else if (schema.tag === "array") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y) => {
      return aqua2ts(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y, i) => {
      return aqua2ts(y, schema.items[i]);
    });
  } else if (schema.tag === "struct" || schema.tag === "labeledProduct") {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = aqua2ts(value[key], type);
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new Error("Unexpected tag: " + JSON.stringify(schema));
  }
}

/**
 * Convert value from its typescript representation to representation in aqua
 * @param value {JSONValue} the value as represented in typescript
 * @param schema {NonArrowSimpleType} - definition of the aqua type
 * @returns {JSONValue} represented in aqua
 */
export function ts2aqua(value, schema) {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    return value == null ? [] : [ts2aqua(value, schema.type)];
  } else if (
    schema.tag === "scalar" ||
    schema.tag === "bottomType" ||
    schema.tag === "topType"
  ) {
    return value;
  } else if (schema.tag === "array") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y) => {
      return ts2aqua(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y, i) => {
      return ts2aqua(y, schema.items[i]);
    });
  } else if (schema.tag === "struct" || schema.tag === "labeledProduct") {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = ts2aqua(value[key], type);
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new Error("Unexpected tag: " + JSON.stringify(schema));
  }
}
