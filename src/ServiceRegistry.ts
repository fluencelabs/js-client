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

import { Service, ServiceMultiple } from './service';
import { Particle } from './particle';
import log from 'loglevel';

export class ServiceRegistry {
    private services: Map<string, Service> = new Map();
    private particlesQueue: Particle[] = [];
    private currentParticle: string | undefined = undefined;

    private storage: Map<string, Map<string, any>> = new Map();
    private storageService: ServiceMultiple;

    constructor() {
        this.storageService = new ServiceMultiple('');

        this.storageService.registerFunction('load', (args: any[]) => {
            let current = this.getCurrentParticleId();

            let data = this.storage.get(current);

            if (data) {
                return data.get(args[0]);
            } else {
                return {};
            }
        });

        this.registerService(this.storageService);
    }

    getCurrentParticleId(): string | undefined {
        return this.currentParticle;
    }

    setCurrentParticleId(particle: string | undefined) {
        this.currentParticle = particle;
    }

    enqueueParticle(particle: Particle): void {
        this.particlesQueue.push(particle);
    }

    popParticle(): Particle | undefined {
        return this.particlesQueue.pop();
    }

    registerService(service: Service) {
        this.services.set(service.serviceId, service);
    }

    deleteService(serviceId: string): boolean {
        return this.services.delete(serviceId);
    }

    getService(serviceId: string): Service | undefined {
        return this.services.get(serviceId);
    }

    addData(particleId: string, data: Map<string, any>, ttl: number) {
        this.storage.set(particleId, data);
        setTimeout(() => {
            log.debug(`data for ${particleId} is deleted`);
            this.storage.delete(particleId);
        }, ttl);
    }
}
