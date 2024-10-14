import { renderToStaticMarkup } from "react-dom/server";

type HtmlParsedAnswer = {
    answerHtml: string;
    citations: string[];
};

export function parseAnswerToHtml(answer: string, isStreaming: boolean): HtmlParsedAnswer {
    const citations: string[] = [];

    // trim any whitespace from the end of the answer after removing follow-up questions
    let parsedAnswer = answer.trim();

    // Omit a citation that is still being typed during streaming
    if (isStreaming) {
        let lastIndex = parsedAnswer.length;
        for (let i = parsedAnswer.length - 1; i >= 0; i--) {
            if (parsedAnswer[i] === "]") {
                break;
            } else if (parsedAnswer[i] === "[") {
                lastIndex = i;
                break;
            }
        }
        const truncatedAnswer = parsedAnswer.substring(0, lastIndex);
        parsedAnswer = truncatedAnswer;
    }

    const parts = parsedAnswer.split(/\[([^\]]+)\]/g);

    const fragments: string[] = parts.map((part, index) => {
        if (index % 2 === 0) {
            return part;
        } else {
            let citationIndex: number;
            if (citations.indexOf(part) !== -1) {
                citationIndex = citations.indexOf(part) + 1;
            } else {
                
                citations.push(part);
                citationIndex = citations.length;
            }
                       
            const ps1 = "https://st6n2j7jnywyfbw.blob.core.windows.net/content/" + part + "?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-07-24T21:10:23Z&st=2024-09-24T13:10:23Z&spr=https&sig=coAbebf2nifm4Owq5Ka%2BFnAg7R70L%2BX23W%2FAxHT87zM%3D"
            return renderToStaticMarkup(               
                <a className="supContainer" title={part} target="_blank" href={ps1}>
                    <sup>{citationIndex}</sup>
                </a>
            );
        }
    });

    return {
        answerHtml: fragments.join(""),
        citations
    };
}
