"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayConnection = exports.FluenceConnection = exports.PROTOCOL_NAME = void 0;
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
// @ts-ignore
var libp2p_websockets_1 = __importDefault(require("libp2p-websockets"));
// @ts-ignore
var libp2p_mplex_1 = __importDefault(require("libp2p-mplex"));
var libp2p_1 = __importDefault(require("libp2p"));
var it_length_prefixed_1 = require("it-length-prefixed");
var it_pipe_1 = require("it-pipe");
var log = __importStar(require("loglevel"));
var libp2p_noise_1 = require("@chainsafe/libp2p-noise");
var multiaddr_1 = require("multiaddr");
// @ts-ignore
var filters_1 = require("libp2p-websockets/src/filters");
var Buffer_1 = __importDefault(require("../../fluence-js/src/internal/Buffer"));
exports.PROTOCOL_NAME = "/fluence/particle/2.0.0";
/**
 * Base class for connectivity layer to Fluence Network
 */
var FluenceConnection = /** @class */ (function () {
    function FluenceConnection() {
    }
    return FluenceConnection;
}());
exports.FluenceConnection = FluenceConnection;
/**
 * Implementation for JS peers which connects to Fluence through relay node
 */
var RelayConnection = /** @class */ (function (_super) {
    __extends(RelayConnection, _super);
    function RelayConnection(peerId, _lib2p2Peer, _relayAddress, relayPeerId) {
        var _this = _super.call(this) || this;
        _this.peerId = peerId;
        _this._lib2p2Peer = _lib2p2Peer;
        _this._relayAddress = _relayAddress;
        _this.relayPeerId = relayPeerId;
        return _this;
    }
    RelayConnection.createConnection = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var transportKey, lib2p2Peer, relayMultiaddr, relayPeerId;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        transportKey = libp2p_websockets_1.default.prototype[Symbol.toStringTag];
                        return [4 /*yield*/, libp2p_1.default.create({
                                peerId: options.peerId,
                                modules: {
                                    transport: [libp2p_websockets_1.default],
                                    streamMuxer: [libp2p_mplex_1.default],
                                    connEncryption: [new libp2p_noise_1.Noise()],
                                },
                                config: {
                                    transport: (_a = {},
                                        _a[transportKey] = {
                                            filter: filters_1.all,
                                        },
                                        _a),
                                },
                                dialer: {
                                    dialTimeout: options === null || options === void 0 ? void 0 : options.dialTimeoutMs,
                                },
                            })];
                    case 1:
                        lib2p2Peer = _b.sent();
                        relayMultiaddr = new multiaddr_1.Multiaddr(options.relayAddress);
                        relayPeerId = relayMultiaddr.getPeerId();
                        if (relayPeerId === null) {
                            throw new Error("Specified multiaddr is invalid or missing peer id: " +
                                options.relayAddress);
                        }
                        return [2 /*return*/, new RelayConnection(
                            // force new line
                            options.peerId.toB58String(), lib2p2Peer, relayMultiaddr, relayPeerId)];
                }
            });
        });
    };
    RelayConnection.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._lib2p2Peer.unhandle(exports.PROTOCOL_NAME)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._lib2p2Peer.stop()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RelayConnection.prototype.sendParticle = function (nextPeerIds, particle) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, sink;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (nextPeerIds.length !== 1 && nextPeerIds[0] !== this.relayPeerId) {
                            throw new Error("Relay connection only accepts peer id of the connected relay. Got: ".concat(JSON.stringify(nextPeerIds), " instead."));
                        }
                        return [4 /*yield*/, this._lib2p2Peer.dialProtocol(this._relayAddress, exports.PROTOCOL_NAME)];
                    case 1:
                        conn = _a.sent();
                        sink = conn.stream.sink;
                        (0, it_pipe_1.pipe)(
                        // force new line
                        [Buffer_1.default.from(particle, "utf8")], (0, it_length_prefixed_1.encode)(), sink);
                        return [2 /*return*/];
                }
            });
        });
    };
    RelayConnection.prototype.connect = function (onIncomingParticle) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, e_1, error;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this._lib2p2Peer.start()];
                    case 1:
                        _c.sent();
                        this._lib2p2Peer.handle([exports.PROTOCOL_NAME], function (_a) {
                            var connection = _a.connection, stream = _a.stream;
                            return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_b) {
                                    (0, it_pipe_1.pipe)(stream.source, 
                                    // @ts-ignore
                                    (0, it_length_prefixed_1.decode)(), function (source) { var source_1, source_1_1; return __awaiter(_this, void 0, void 0, function () {
                                        var msg, e_2_1, e_3;
                                        var e_2, _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    _b.trys.push([0, 13, , 14]);
                                                    _b.label = 1;
                                                case 1:
                                                    _b.trys.push([1, 6, 7, 12]);
                                                    source_1 = __asyncValues(source);
                                                    _b.label = 2;
                                                case 2: return [4 /*yield*/, source_1.next()];
                                                case 3:
                                                    if (!(source_1_1 = _b.sent(), !source_1_1.done)) return [3 /*break*/, 5];
                                                    msg = source_1_1.value;
                                                    try {
                                                        onIncomingParticle(msg);
                                                    }
                                                    catch (e) {
                                                        log.error("error on handling a new incoming message: " +
                                                            e);
                                                    }
                                                    _b.label = 4;
                                                case 4: return [3 /*break*/, 2];
                                                case 5: return [3 /*break*/, 12];
                                                case 6:
                                                    e_2_1 = _b.sent();
                                                    e_2 = { error: e_2_1 };
                                                    return [3 /*break*/, 12];
                                                case 7:
                                                    _b.trys.push([7, , 10, 11]);
                                                    if (!(source_1_1 && !source_1_1.done && (_a = source_1.return))) return [3 /*break*/, 9];
                                                    return [4 /*yield*/, _a.call(source_1)];
                                                case 8:
                                                    _b.sent();
                                                    _b.label = 9;
                                                case 9: return [3 /*break*/, 11];
                                                case 10:
                                                    if (e_2) throw e_2.error;
                                                    return [7 /*endfinally*/];
                                                case 11: return [7 /*endfinally*/];
                                                case 12: return [3 /*break*/, 14];
                                                case 13:
                                                    e_3 = _b.sent();
                                                    log.debug("connection closed: " + e_3);
                                                    return [3 /*break*/, 14];
                                                case 14: return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    return [2 /*return*/];
                                });
                            });
                        });
                        log.debug("dialing to the node with client's address: " +
                            this._lib2p2Peer.peerId.toB58String());
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        _b = this;
                        return [4 /*yield*/, this._lib2p2Peer.dial(this._relayAddress)];
                    case 3:
                        _b._connection = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _c.sent();
                        if (e_1.name === "AggregateError" && ((_a = e_1._errors) === null || _a === void 0 ? void 0 : _a.length) === 1) {
                            error = e_1._errors[0];
                            throw new Error("Error dialing node ".concat(this._relayAddress, ":\n").concat(error.code, "\n").concat(error.message));
                        }
                        else {
                            throw e_1;
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return RelayConnection;
}(FluenceConnection));
exports.RelayConnection = RelayConnection;
