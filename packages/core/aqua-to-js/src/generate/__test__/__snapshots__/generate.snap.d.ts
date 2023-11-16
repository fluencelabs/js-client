/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.0.0
 * @fluencelabs/aqua-to-js version: 0.0.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */
import type { IFluenceClient as IFluenceClient$$, ParticleContext as ParticleContext$$ } from '@fluencelabs/js-client';

// Making aliases to reduce chance of accidental name collision
import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
    FluencePeer as FluencePeer$$
} from '@fluencelabs/js-client';

// Services
export interface SrvDef {
    create: (wasm_b64_content: string, callParams: ParticleContext$$) => { error: string | null; service_id: string | null; success: boolean; } | Promise<{ error: string | null; service_id: string | null; success: boolean; }>;
    list: (callParams: ParticleContext$$) => string[] | Promise<string[]>;
    remove: (service_id: string, callParams: ParticleContext$$) => { error: string | null; success: boolean; } | Promise<{ error: string | null; success: boolean; }>;
}
export function registerSrv(service: SrvDef): void;
export function registerSrv(serviceId: string, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, serviceId: string, service: SrvDef): void;
export interface CalcServiceDef {
    add: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    clear_state: (callParams: ParticleContext$$) => void | Promise<void>;
    divide: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    multiply: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    state: (callParams: ParticleContext$$) => number | Promise<number>;
    subtract: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    test_logs: (callParams: ParticleContext$$) => void | Promise<void>;
}
export function registerCalcService(serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, serviceId: string, service: CalcServiceDef): void;
export interface HelloWorldDef {
    hello: (str: string, callParams: ParticleContext$$) => string | Promise<string>;
}
export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, serviceId: string, service: HelloWorldDef): void;

// Functions
export type ResourceTestResultType = [string | null, string[]]

export type resourceTestParams = [label: string, config?: {ttl?: number}] | [peer: IFluenceClient$$, label: string, config?: {ttl?: number}];

export type ResourceTestResult = Promise<ResourceTestResultType>;

export type helloTestParams = [config?: {ttl?: number}] | [peer: IFluenceClient$$, config?: {ttl?: number}];

export type HelloTestResult = Promise<string>;

export type demo_calculationParams = [service_id: string, config?: {ttl?: number}] | [peer: IFluenceClient$$, service_id: string, config?: {ttl?: number}];

export type Demo_calculationResult = Promise<number>;

export type marineTestParams = [wasm64: string, config?: {ttl?: number}] | [peer: IFluenceClient$$, wasm64: string, config?: {ttl?: number}];

export type MarineTestResult = Promise<number>;

