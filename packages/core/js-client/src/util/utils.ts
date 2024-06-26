/**
 * Copyright 2024 Fluence DAO
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function jsonify(obj: unknown) {
  return JSON.stringify(obj, null, 4);
}

export const isString = (unknown: unknown): unknown is string => {
  return unknown !== null && typeof unknown === "string";
};

export const isObject = (unknown: unknown): unknown is object => {
  return unknown !== null && typeof unknown === "object";
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export function zip<A, B>(arr1: Array<A>, arr2: Array<B>): Array<[A, B]> {
  if (arr1.length !== arr2.length) {
    throw new Error(`Array length doesn't match`);
  }

  const arr = new Array<[A, B]>(arr1.length);

  for (let i = 0; i < arr1.length; i++) {
    // Length has been checked above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    arr[i] = [arr1[i]!, arr2[i]!];
  }

  return arr;
}
