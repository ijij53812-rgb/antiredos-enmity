/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 */

const patcher = window.enmity.patcher.create("AntiReDoS");
const getByProps = (...props) => window.enmity.modules.getByProps(...props);

function sanitizeInput(text) {
    if (typeof text !== "string") return text;
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");
    text = text.replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");
    return text;
}

function findMarkdownModule() {
    const m1 = getByProps("defaultBlockParse");
    if (m1) return { module: m1, method: "defaultBlockParse" };

    const m2 = getByProps("parse", "parseBlock");
    if (m2) return { module: m2, method: "parse" };

    const m3 = getByProps("markdownToAST");
    if (m3) return { module: m3, method: "markdownToAST" };

    const m4 = getByProps("renderRule", "parse");
    if (m4 && m4.parse) return { module: m4, method: "parse" };

    return null;
}

const manifest = {
    name: "AntiReDoS",
    version: "1.4.0",
    description: "무량공처(ReDoS) 공격 차단",
    authors: [{ name: "A", id: "0" }],
};

const AntiReDoS = {
    ...manifest,

    // ← 이 필드가 없으면 Enmity가 재시작 후 플러그인 상태를 복원하지 못함
    patches: [],

    onStart() {
        try {
            const found = findMarkdownModule();

            if (!found) {
                console.warn("[AntiReDoS] 마크다운 파서 모듈을 찾지 못했습니다.");
                return;
            }

            // 실제 Enmity patcher 시그니처: patcher.before(module, method, callback)
            patcher.before(found.module, found.method, (_, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = sanitizeInput(args[0]);
                }
            });

            console.log("[AntiReDoS] 활성화 — 대상:", found.method);
        } catch (e) {
            console.error("[AntiReDoS] onStart 오류:", e);
        }
    },

    onStop() {
        patcher.unpatchAll();
        console.log("[AntiReDoS] 비활성화됨");
    },
};

window.enmity.plugins.registerPlugin(AntiReDoS);
