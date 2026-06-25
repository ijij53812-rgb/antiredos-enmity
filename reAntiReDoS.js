/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 * 
 * 실제 작동 플러그인(NoBandwidthKick, BetterTwitterEmbeds) 구조 기반
 */

// ── Enmity 글로벌 API ─────────────────────────────────────────────────────
const getByProps  = (...p) => window.enmity.modules.getByProps(...p);
const getByName   = (...p) => window.enmity.modules.getByName(...p);
const getByKeyword= (...p) => window.enmity.modules.getByKeyword(...p);
const bulk        = (...f) => window.enmity.modules.bulk(...f);
const filters     = window.enmity.modules.filters;

// ── patcher 인스턴스 생성 (NoBandwidthKick 방식 그대로) ──────────────────
const patcher = window.enmity.patcher.create("AntiReDoS");

// ── ReDoS 입력 새니타이즈 ────────────────────────────────────────────────
function sanitizeInput(text) {
    if (typeof text !== "string") return text;
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");
    text = text.replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");
    return text;
}

// ── 마크다운 파서 모듈 탐색 ───────────────────────────────────────────────
function findMarkdownModule() {
    // 1. bulk + byProps 조합 (가장 신뢰도 높음)
    try {
        const [m] = bulk(filters.byProps("defaultBlockParse"));
        if (m) return { module: m, method: "defaultBlockParse" };
    } catch(_) {}

    try {
        const [m] = bulk(filters.byProps("parse", "parseBlock"));
        if (m) return { module: m, method: "parse" };
    } catch(_) {}

    // 2. getByProps 직접
    const m1 = getByProps("defaultBlockParse");
    if (m1) return { module: m1, method: "defaultBlockParse" };

    const m2 = getByProps("parse", "parseBlock");
    if (m2) return { module: m2, method: "parse" };

    // 3. getByKeyword로 파서 탐색
    try {
        const m3 = getByKeyword("defaultBlockParse");
        if (m3) return { module: m3, method: "defaultBlockParse" };
    } catch(_) {}

    try {
        const m4 = getByKeyword("markdownToAST");
        if (m4) return { module: m4, method: "markdownToAST" };
    } catch(_) {}

    return null;
}

// ── 플러그인 본체 (NoBandwidthKick 구조 그대로) ──────────────────────────
const manifest = {
    name: "AntiReDoS",
    version: "1.6.0",
    description: "무량공처(ReDoS) 공격 차단",
    authors: [{ name: "A", id: "0" }],
    color: "#ff4444",
};

const AntiReDoS = {
    ...manifest,

    onStart() {
        const found = findMarkdownModule();

        if (!found) {
            console.warn("[AntiReDoS] 마크다운 파서 모듈을 찾지 못했습니다.");
            return;
        }

        // NoBandwidthKick과 동일한 patcher.before 시그니처
        patcher.before(found.module, found.method, (self, args, res) => {
            if (args[0] && typeof args[0] === "string") {
                args[0] = sanitizeInput(args[0]);
            }
        });

        console.log("[AntiReDoS] 활성화 — 패치 대상:", found.method);
    },

    onStop() {
        patcher.unpatchAll();
        console.log("[AntiReDoS] 비활성화됨");
    },
};

window.enmity.plugins.registerPlugin(AntiReDoS);
