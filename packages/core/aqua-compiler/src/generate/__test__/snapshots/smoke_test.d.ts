/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.0.0
 * @fluencelabs/aqua-compiler version: 0.0.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */
import type { IFluenceClient as IFluenceClient$$, CallParams as CallParams$$ } from '@fluencelabs/js-client';

import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
} from '@fluencelabs/js-client';

// Services
export interface SrvDef {
    create: (wasm_b64_content: string, callParams: CallParams$$<'wasm_b64_content'>) => { error: string | null; service_id: string | null; success: boolean; } | Promise<{ error: string | null; service_id: string | null; success: boolean; }>;
    list: (callParams: CallParams$$<null>) => string[] | Promise<string[]>;
    remove: (service_id: string, callParams: CallParams$$<'service_id'>) => { error: string | null; success: boolean; } | Promise<{ error: string | null; success: boolean; }>;
}
export function registerSrv(service: SrvDef): void;
export function registerSrv(serviceId: string, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, serviceId: string, service: SrvDef): void;
export interface CalcServiceDef {
    add: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    clear_state: (callParams: CallParams$$<null>) => void | Promise<void>;
    divide: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    multiply: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    state: (callParams: CallParams$$<null>) => number | Promise<number>;
    subtract: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    test_logs: (callParams: CallParams$$<null>) => void | Promise<void>;
}
export function registerCalcService(service: CalcServiceDef): void;
export function registerCalcService(serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, serviceId: string, service: CalcServiceDef): void;
export interface HelloWorldDef {
    hello: (str: string, callParams: CallParams$$<'str'>) => string | Promise<string>;
}
export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, serviceId: string, service: HelloWorldDef): void;

// Functions
export type ResourceTestResult = [string | null, string[]]

export function resourceTest(
    label: string,
    config?: {ttl?: number}
): Promise<ResourceTestResult>;

export function resourceTest(
    peer: IFluenceClient$$,
    label: string,
    config?: {ttl?: number}
): Promise<ResourceTestResult>;

export function helloTest(
    config?: {ttl?: number}
): Promise<string>;

export function helloTest(
    peer: IFluenceClient$$,
    config?: {ttl?: number}
): Promise<string>;

export function demo_calculation(
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function demo_calculation(
    peer: IFluenceClient$$,
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(
    peer: IFluenceClient$$,
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

