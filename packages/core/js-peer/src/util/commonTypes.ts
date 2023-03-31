export interface IModule {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export type JSONValue = string | number | boolean | null | { [x: string]: JSONValue } | Array<JSONValue>;
export type JSONArray = Array<JSONValue>;
export type JSONObject = { [x: string]: JSONValue };
