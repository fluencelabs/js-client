/**
 * Copyright 2023 Fluence Labs Limited
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
  const buffer = new ArrayBuffer(size);
  const dv = new DataView(buffer);
  dv.setUint32(0, n, littleEndian);
  return new Uint8Array(buffer);
}

export function numberToLittleEndianBytes(n: number, s: Size) {
  return numberToBytes(n, s, true);
}
