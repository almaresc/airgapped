import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { Button } from "@fluentui/react-components";
import { Send28Filled, Mic48Filled } from "@fluentui/react-icons";
import { ResultReason, SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
import styles from "./QuestionInput.module.css";


interface Props {
    onSend: (question: string) => void;
    disabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
    language: string;   
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, language }: Props) => {
    const [question, setQuestion] = useState<string>("");
   
    const sendQuestion = () => {
        if (disabled || !question.trim()) {
            return;
        }

        onSend(question);

        if (clearOnSend) {
            setQuestion("");
        }
    };

    const listenQuestion = async () => {
 
        const speechConfig = SpeechConfig.fromSubscription("b80e5087c70e483aae9a708ddb5e5bb0", "SwitzerlandNorth");

        speechConfig.speechRecognitionLanguage = language;

        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        //this.setState({
        //    displayText: 'speak into your microphone...'
        //});

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `${result.text}`


                setQuestion(displayText);
                onSend(displayText);

                if (clearOnSend) {
                    setQuestion("");
                }
            }
        });
    };

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        if (!newValue) {
            setQuestion("");
        } else if (newValue.length <= 1000) {
            setQuestion(newValue);
        }
    };

    const sendQuestionDisabled = disabled || !question.trim();

    return (
        <Stack horizontal className={styles.questionInputContainer}>
            <TextField
                className={styles.questionInputTextArea}
                placeholder={placeholder}
                multiline
                resizable={false}
                borderless
                value={question}
                onChange={onQuestionChange}
                onKeyDown={onEnterPress}
            />
            <div className={styles.questionInputButtonsContainer}>              
                    <Button size="large" icon={<Send28Filled primaryFill="#00428A" />} disabled={sendQuestionDisabled} onClick={sendQuestion} />
                    <Button size="large" icon={<Mic48Filled primaryFill="#00428A" />} disabled={disabled}  onClick={listenQuestion} />              
            </div>
        </Stack>
    );
};
