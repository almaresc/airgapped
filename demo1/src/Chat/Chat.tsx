/* eslint-disable no-constant-condition */
"use client";
import { useState, useEffect, useRef } from "react";
import { QuestionInput } from "../components/QuestionInput";
import { Answer, AnswerError, AnswerLoading } from "../components/Answer";
import { UserChatMessage } from "../components/UserChatMessage";
import styles from "./Chat.module.css";

interface Props {
    //welcomMessage: string;
    //lan: string;
    infocontext: string;
    icon: string;
}

//interface  ItemRag {
//    text: string;
//}

export const ChatUI = ({ infocontext, icon }: Props) => {

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    const [error, setError] = useState<unknown>();
    const [query] = useState<string>("");
    const [loadingtxt, setLoadingtxt] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [streamedAnswers, setStreamedAnswers] = useState<[user: string, response: string][]>([]);
    const lastQuestionRef = useRef<string>("");

    const [welcomeMessage, setWelcomeMessage] = useState<string>("");
    const [languageText, setLanguageText] = useState<string>("");
    const [voice, setVoice] = useState<string>("");
    const [language, setLanguage] = useState<string>("");
    const [placeholderInput, setPlaceholderInput] = useState<string>("");
    const [placeholderAudioInput, setPlaceholderAudioInput] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const [answers, setAnswers] = useState<[user: string, response: string][]>([]);

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [isLoading]);
    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "auto" }), [streamedAnswers]);

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        let fake = query + placeholderAudioInput;
        fake += "op 2 3";
        
        try {
            setIsStreaming(true);

            const o = JSON.stringify({ 'answers': answers, 'context': infocontext, 'lastQuestion': question });
            startGeneration(o, question);                
           
            setIsStreaming(false);

        } catch (e) {
            setError("Errore imprevisto, prego riprovare.");
        } finally {
            //setIsLoading(false);
        }

    };

    async function startGeneration(requestData: any, question: string) {

        setIsLoading(true);
        
        let answer: string = "";

        const updateState = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    answer += newContent;
                    setIsLoading(false);
                    setStreamedAnswers([...answers, [question, answer]]);
                    setAnswers([...answers, [question, answer]]);
                    resolve(null);
                }, 33);
            });
        };
                
        const response = await fetch('http://localhost:5001/DemoOperations/start-generation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestData
        });

        const { sessionId } = await response.json();
        const eventSource = new EventSource(`http://localhost:5001/DemoOperations/rag_v2/${sessionId}`);

        eventSource.onmessage = function (event) {
            const newToken = event.data;
            console.log(newToken);
            // Processa il nuovo token
        };

        eventSource.onmessage = function (event) {
            const newToken = event.data;
            updateState(newToken);
            // Processa il nuovo token
        };

        eventSource.onerror = function (err) {
            console.error("EventSource failed:", err);
            eventSource.close();
        };
    }

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        let lanl = searchParams.get("lan");
        if (lanl == null)
            lanl = "it-IT";

        setLanguage(lanl);

        setLanguageText(languageText);
        if (lanl == "it-IT") {
            setVoice("it-IT-GianniNeural");
            setLanguageText("Italiano");
            setPlaceholderAudioInput("Ascolta la risposta");
            setLoadingtxt("Sto cercando le informazioni necessarie a rispondere...");
            setPlaceholderInput("Fai una domanda..");
            setErrorMessage("Errore imprevisto, riprovare");
            setWelcomeMessage("Ciao! Sono il tuo assistente virtuale! Posso rispondere a domande sul documento caricato.");

        }
        //else if (lanl == "fr-FR") {
        //    setLanguageText("Francese");            
        //    setPlaceholderInput("&#201;crivez une question..");
        //    setErrorMessage("Erreur inattendue, veuillez r&eacute;essayer");
        //    setWelcomeMessage("Bonjour; salut! Je suis l'assistante virtuelle de la Pr&eacute;sidence du Conseil des Ministres ! Je peux r&eacute;pondre &aacute; des questions sur le code civil et criminel. Demandez si vous en avez besoin.");
        //}
        else if (lanl == "en-EN") {
            setVoice("en-GB-SoniaNeural");
            setLanguageText("Inglese");
            setPlaceholderAudioInput("Listen the answer");
            setLoadingtxt("I'm looking for the information needed to respond...");
            setErrorMessage("Unexpected error. Please retry");
            setPlaceholderInput("Do a question..");
            setWelcomeMessage("HI! I am the virtual assistant of the Presidency of the Council of Ministers! I can answer questions about the civil and criminal code. Ask if you need.");
        }
        else if (lanl == "de-DE") {
            setVoice("de-DE-ElkeNeural");
            setLanguageText("Tedesco");
            setLoadingtxt("Ich suche nach den Informationen, die ich beantworten muss...");
            setErrorMessage("Unerwarteter Fehler, bitte versuchen Sie es erneut");
            setPlaceholderAudioInput("Hören Sie sich die Antwort an");
            setPlaceholderInput("Stelle eine Frage..");
            setWelcomeMessage("HALLO! Ich bin der virtuelle Assistent der Präsidentschaft des Ministerrats! Ich kann Fragen zum Zivil- und Strafgesetzbuch beantworten. Fragen Sie bei Bedarf.");

        }
    });
 
    return (       

        <div id="maincontainer" className={styles.container}>
            <div className={styles.chatRoot}>
              
                    <div className={styles.chatMessageStream}>
                    <Answer
                        isStreaming={isStreaming}
                        key={-1}
                    
                        answer={welcomeMessage}
                        icon={icon}
                        voice={voice}
                        language={language}
                        />
                    {isStreaming &&
                            streamedAnswers.map((streamedAnswer, index) => (
                        <div key={index}>
                            <UserChatMessage message={streamedAnswer[0]} />
                            <div className={styles.chatMessageGpt}>
                                <Answer
                                            isStreaming={isStreaming}
                                        
                                            key={index}
                                            answer={streamedAnswer[1]}
                                            icon={icon}
                                            voice={voice}
                                            language={language}
                                />
                            </div>
                        </div>
                    ))}  
                    {!isStreaming &&
                            answers.map((answer, index) => (
                                <div key={index}>
                                    <UserChatMessage message={answer[0]} />
                                    <div className={styles.chatMessageGpt}>
                                        <Answer
                                           
                                            isStreaming={isStreaming}
                                            key={index}
                                            answer={answer[1]}
                                            icon={icon}
                                            voice={voice}
                                            language={language}
                                        />
                                    </div>
                                </div>
                            ))}
                    {isLoading && (
                        <>
                            <UserChatMessage message={lastQuestionRef.current} />
                            <div className={styles.chatMessageGptMinWidth}>
                                <AnswerLoading text={loadingtxt} icon={icon} />
                            </div>
                        </>
                    )}
                    {error ? (
                        <>
                            <UserChatMessage message={lastQuestionRef.current} />
                            <div className={styles.chatMessageGptMinWidth}>
                                <AnswerError error={errorMessage} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
                            </div>
                        </>
                    ) : null}
                    <div ref={chatMessageStreamEnd} />
                </div>                
               
                    <div className={styles.chatInput}>
                <QuestionInput
                        clearOnSend
                        placeholder={placeholderInput}
                        disabled={isStreaming}
                        onSend={prompt => makeApiRequest(prompt)}
                        language={language}
                />
            </div>
                </div>
         </div>
       
      
    );
};

export default ChatUI;