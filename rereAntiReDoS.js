/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 * Enmity db482b0 / Discord 261.0 / Hermes 기준
 */

const patcher    = window.enmity.patcher.create("AntiReDoS");
const getByProps = (...p) => window.enmity.modules.getByProps(...p);
const getModule  = (fn, o) => window.enmity.modules.getModule(fn, o);

// ── ReDoS 새니타이즈 ──────────────────────────────────────────────────────
function sanitizeInput(text) {
    if (typeof text !== "string") return text;
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");
    text = text.replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");
    return text;
}

// ── 마크다운 파서 모듈 탐색 ───────────────────────────────────────────────
function findMarkdownModule() {
    // 1. getByProps 직접 시도
    const candidates = [
        ["defaultBlockParse"],
        ["parse", "parseBlock"],
        ["markdownToAST"],
        ["parseToAST"],
        ["parseTopic"],
    ];

    for (const props of candidates) {
        try {
            const m = getByProps(...props);
            if (m && typeof m[props[0]] === "function") {
                return { module: m, method: props[0] };
            }
        } catch(_) {}
    }

    // 2. getModule로 전체 탐색 (NoBlockedMessage 방식)
    const parseMethods = ["defaultBlockParse", "parse", "markdownToAST", "parseToAST"];
    for (const method of parseMethods) {
        try {
            const m = getModule(o => o && typeof o[method] === "function" && typeof o[method] === "function");
            if (m) return { module: m, method };
        } catch(_) {}
    }

    return null;
}

// ── Dispatcher 후킹 (폴백) ────────────────────────────────────────────────
function hookDispatcher() {
    try {
        const Dispatcher = window.enmity.modules.common.Dispatcher;
        if (!Dispatcher) return false;

        const handler = (e) => {
            try {
                if (e?.message?.content) {
                    e.message.content = sanitizeInput(e.message.content);
                }
            } catch(_) {}
        };

        Dispatcher.subscribe("MESSAGE_CREATE", handler);
        Dispatcher.subscribe("MESSAGE_UPDATE", handler);
        AntiReDoS._handler = handler;
        return true;
    } catch(_) {
        return false;
    }
}

// ── 플러그인 본체 ─────────────────────────────────────────────────────────
const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.8.0",
    description: "무량공처(ReDoS) 공격 차단",
    authors: [{ name: "A", id: "0" }],
    color: "#ff4444",

    _handler: null,

    onStart() {
        const found = findMarkdownModule();

        if (found) {
            patcher.before(found.module, found.method, (self, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = sanitizeInput(args[0]);
                }
            });
        } else {
            // 파서 못 찾으면 Dispatcher 폴백
            hookDispatcher();

            // 1초 후 재시도
            setTimeout(() => {
                if (!AntiReDoS._handler) return;
                const retry = findMarkdownModule();
                if (retry) {
                    // Dispatcher 해제하고 파서 패치로 전환
                    try {
                        const D = window.enmity.modules.common.Dispatcher;
                        D.unsubscribe("MESSAGE_CREATE", AntiReDoS._handler);
                        D.unsubscribe("MESSAGE_UPDATE", AntiReDoS._handler);
                        AntiReDoS._handler = null;
                    } catch(_) {}

                    patcher.before(retry.module, retry.method, (self, args) => {
                        if (args[0] && typeof args[0] === "string") {
                            args[0] = sanitizeInput(args[0]);
                        }
                    });
                }
            }, 1000);
        }
    },

    onStop() {
        patcher.unpatchAll();

        if (this._handler) {
            try {
                const D = window.enmity.modules.common.Dispatcher;
                D.unsubscribe("MESSAGE_CREATE", this._handler);
                D.unsubscribe("MESSAGE_UPDATE", this._handler);
                this._handler = null;
            } catch(_) {}
        }
    },
};

window.enmity.plugins.registerPlugin(AntiReDoS);
