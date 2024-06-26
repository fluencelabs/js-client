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

type Size = "u32" | "u64";

const sizeMap = {
  u32: 4,
  u64: 8,
} as const;

function numberToBytes(n: number, s: Size, littleEndian: boolean) {
  const size = sizeMap[s];
  const buffer = new ArrayBuffer(8);
  const dv = new DataView(buffer);
  dv.setBigUint64(0, BigInt(n), littleEndian);
  return new Uint8Array(buffer.slice(0, size));
}

export function numberToLittleEndianBytes(n: number, s: Size) {
  return numberToBytes(n, s, true);
}
