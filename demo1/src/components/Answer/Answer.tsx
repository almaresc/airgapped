/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState } from "react";
import { Stack } from "@fluentui/react";
/*import DOMPurify from "dompurify";*/
import { Button } from "@fluentui/react-components";
import { Speaker248Filled } from "@fluentui/react-icons";
import { SpeakerAudioDestination, SpeechConfig, AudioConfig, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk';

import styles from "./Answer.module.css";

import { parseAnswerToHtml } from "./AnswerParser";

interface Props {
    answer: string;   
    isStreaming: boolean;
    icon: string;
    /*audioPlaceholder: string;*/
    voice: string;
    language: string
}

export const Answer = ({
    answer,    
    isStreaming,
    icon,    
    voice,
    language
      
}: Props) => {
   
    const messageContent = answer;
    const parsedAnswer = useMemo(() => parseAnswerToHtml(messageContent, isStreaming), [answer]);
    const [player, updatePlayer] = useState({ p: new SpeakerAudioDestination(), muted: false });

    /*const sanitizedAnswerHtml = DOMPurify.sanitize(parsedAnswer.answerHtml);*/
    const textToSpeech = () => {
        const speechConfig = SpeechConfig.fromSubscription("b80e5087c70e483aae9a708ddb5e5bb0", "SwitzerlandNorth");
        
        const myPlayer = new SpeakerAudioDestination();
        updatePlayer(p => { p.p = myPlayer; return p; });
        const audioConfig = AudioConfig.fromSpeakerOutput(player.p);
       
        speechConfig.speechSynthesisVoiceName = voice;
        speechConfig.speechSynthesisLanguage = language;
        let synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

        //let start = 0;
        let txt = answer;
        let start = 0;
        var  to_replace:string[] = [];
        while (start < answer.length) { 

            if (answer[start] == "[") {
              
                let end = answer.substring(start, answer.length).indexOf("]") + 1;
               
                let to_rep = answer.substring(start, start+end);
                to_replace.push(to_rep);
                start += end;
            }
            else {
                start += 1;
            }

        }

        for (let i = 0; i < to_replace.length;i++)
        {
            txt = txt.replace(to_replace[i], "");
        }

        synthesizer.speakTextAsync(
            txt,
            () => {               
                synthesizer.close();
               /* synthesizer = undefined;         */      
            },
            function () {               
                synthesizer.close();
            //    synthesizer = undefined;
            });
    }


    return (
        <Stack className={styles.answerContainer} verticalAlign="space-between">

            <Stack.Item grow>
                <div>
                    <span className="imgSpan"><img src={icon} className={styles.img} /></span>
                    <span className="answerText" dangerouslySetInnerHTML={{ __html: parsedAnswer.answerHtml }}></span>
                    <span>                      
                     <Button size="large" icon={<Speaker248Filled primaryFill="#00428A" />} disabled={isStreaming} onClick={textToSpeech} />                     
                    </span>
                </div>
            </Stack.Item>

         
        </Stack>

    );
};
