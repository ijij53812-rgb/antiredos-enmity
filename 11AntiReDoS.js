/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 */

// ── Enmity 공통 API (실제 컴파일 소스 기준) ───────────────────────────────
const patcher  = window.enmity.patcher.create("AntiReDoS");
const filters  = window.enmity.modules.filters;
const bulk     = (...f) => window.enmity.modules.bulk(...f);
const getByProps = (...p) => window.enmity.modules.getByProps(...p);

// ── ReDoS 입력 새니타이즈 ────────────────────────────────────────────────
function sanitizeInput(text) {
    if (typeof text !== "string") return text;
    // 중첩 [ 구조 과도 반복 차단
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");
    // Vencord 방식: 취약 파서 트리거 패턴 말미 제거
    text = text.replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");
    return text;
}

// ── 마크다운 파서 모듈 탐색 (우선순위 순) ─────────────────────────────────
function findMarkdownModule() {
    // 1순위: common.Messages 모듈 안의 파서 (iOS Discord 다수 버전)
    try {
        const msgs = window.enmity.modules.common.Messages;
        if (msgs && msgs.parse)       return { module: msgs, method: "parse" };
        if (msgs && msgs.defaultBlockParse) return { module: msgs, method: "defaultBlockParse" };
    } catch(_) {}

    // 2순위: getByProps로 탐색
    const m1 = getByProps("defaultBlockParse");
    if (m1) return { module: m1, method: "defaultBlockParse" };

    const m2 = getByProps("parse", "parseBlock");
    if (m2) return { module: m2, method: "parse" };

    const m3 = getByProps("markdownToAST");
    if (m3) return { module: m3, method: "markdownToAST" };

    // 3순위: bulk 탐색
    try {
        const [m4] = bulk(filters.byProps("defaultBlockParse"));
        if (m4) return { module: m4, method: "defaultBlockParse" };
    } catch(_) {}

    return null;
}

// ── 플러그인 본체 ─────────────────────────────────────────────────────────
const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.5.0",
    description: "무량공처(ReDoS) 공격 차단",
    authors: [{ name: "A", id: "0" }],
    patches: [],  // Enmity 상태 복원에 필수

    onStart() {
        try {
            const found = findMarkdownModule();

            if (!found) {
                console.warn("[AntiReDoS] 마크다운 파서 모듈을 찾지 못했습니다.");
                return;
            }

            // 실제 Enmity patcher 시그니처: patcher.before(module, method, (self, args, res) => {})
            patcher.before(found.module, found.method, (self, args, res) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = sanitizeInput(args[0]);
                }
            });

            console.log("[AntiReDoS] 활성화 — 대상:", found.method);
        } catch(e) {
            console.error("[AntiReDoS] onStart 오류:", e);
        }
    },

    onStop() {
        patcher.unpatchAll();
        console.log("[AntiReDoS] 비활성화됨");
    },
};

window.enmity.plugins.registerPlugin(AntiReDoS);
