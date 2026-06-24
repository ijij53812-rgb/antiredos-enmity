/**
 * AntiReDoS - Enmity Plugin
 * 무량공처를 막아줍니다.
 * 
 * GitHub에 올린 후 raw 링크로 Enmity에서 설치하세요.
 * 예시: https://raw.githubusercontent.com/[유저명]/[레포명]/main/index.js
 */

const { Plugin } = enmity.managers.plugins;
const { Patcher } = enmity.metro.common;
const { getModule } = enmity.metro;

const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.0.0",
    description: "무량공처를 막아줍니다.",
    authors: [{ name: "A", id: "0" }],

    onStart() {
        const MarkdownModule = getModule(m => m && m.defaultBlockParse);

        if (!MarkdownModule) {
            console.warn("[AntiReDoS] defaultBlockParse 모듈을 찾지 못했습니다.");
            return;
        }

        Patcher.before("AntiReDoS", MarkdownModule, "defaultBlockParse", (_, args) => {
            if (args[0] && typeof args[0] === "string") {
                // ReDoS 트리거 패턴 무력화 (Vencord의 '(?!)' 교체와 동일한 효과)
                args[0] = args[0].replace(
                    /(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g,
                    ""
                );
            }
        });

        console.log("[AntiReDoS] 활성화됨");
    },

    onStop() {
        Patcher.unpatchAll("AntiReDoS");
        console.log("[AntiReDoS] 비활성화됨");
    },
};

registerPlugin(AntiReDoS);
