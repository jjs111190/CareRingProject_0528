"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const localtunnel_1 = __importDefault(require("localtunnel"));
const port = 8000;
const subdomain = 'mycarering';
function startTunnel() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tunnel = yield (0, localtunnel_1.default)({ port, subdomain });
            console.log(`✅ Tunnel is running at: ${tunnel.url}`);
            tunnel.on('close', () => {
                console.warn('❌ Tunnel closed. Reconnecting...');
                retryTunnel();
            });
            tunnel.on('error', (err) => {
                console.error('❌ Tunnel error:', err.message);
                retryTunnel();
            });
        }
        catch (err) {
            console.error('❌ Failed to start tunnel:', err.message);
            retryTunnel();
        }
    });
}
function retryTunnel(delay = 3000) {
    setTimeout(() => {
        startTunnel();
    }, delay);
}
startTunnel();
