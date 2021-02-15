/*
 * Copyright 2020 Fluence Labs Limited
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

import { ParticleHandler, InterpreterOutcome } from './commonTypes';
import { Particle } from './particle';

export interface ParticleProcessorStrategy {
    particleHandler: ParticleHandler;
    sendParticleFurther: (particle: Particle) => void;

    onParticleTimeout?: (particle: Particle, now: number) => void;
    onLocalParticleRecieved?: (particle: Particle) => void;
    onExternalParticleRecieved?: (particle: Particle) => void;
    onInterpreterExecuting?: (particle: Particle) => void;
    onInterpreterExecuted?: (interpreterOutcome: InterpreterOutcome) => void;
}
