import { useState, ChangeEvent } from 'react'
import './App.css'
import Chat from './Chat/Chat'
import { Button } from "@fluentui/react-components";
import { Mic48Filled, MicPulseOff48Filled } from "@fluentui/react-icons";
import { ResultReason, SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

class Page {

    pageNumber: number;
    lines: Line[];

    constructor(pageNumber: number, lines: Line[]) {
        this.pageNumber = pageNumber;
        this.lines = lines;
    }
}

class Line {
    content: string;

    constructor(content: string,) {
        this.content = content;
    }
}

class Cell {
    kind: string;
    rowIndex: string;
    columnIndex: string;
    content: string;

    constructor(kind: string, rowIndex: string, columnIndex: string, content: string) {
        this.kind = kind;
        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
        this.content = content;
    }
}

class Table {
    cells: Cell[];

    constructor(cells: Cell[]) {
        this.cells = cells;
        
    }
}



function App() {

    const [file, setFile] = useState<File | null>(null);
 
    const [showOCR, setShowOCR] = useState(false);
    const [showCopilot, setShowCopilot] = useState(false);
    const [showOthers, setShowOthers] = useState(false);
    const [showRealTime, setShowRealTime] = useState(false);
    const [showHomePage, setShowHomePage] = useState(true);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [ocrResult, setOcrResult] = useState("");
    const [ocrResultLoading, setOcrResultLoading] = useState("");
    const [otherContent, setOtherContent] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [transcription, setTranscription] = useState("");
    const [recognizer, setRecognizer] = useState<SpeechRecognizer | null>(null );

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
      
    };

    const languageSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLanguage(event.target.value);

    };

    const step1 = () => {
        setShowOCR(true);
        setShowFileUpload(false);
    }

    const openCopilot = () => {
        setShowOCR(false);
        setShowFileUpload(false);
        setShowCopilot(true);
        setShowOthers(false);
        setShowRealTime(false);
    }

    const openOthers = () => {
        setShowOCR(false);
        setShowFileUpload(false);
        setShowCopilot(false);
        setShowOthers(true);
        setShowRealTime(false);
    }   

    const ocr = async () => {
        const updateOcr = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const jsonResponse = JSON.parse(newContent);

                    if (jsonResponse.status == "succeeded") {
                        console.log('Result:', jsonResponse);
                        
                        let ocrObj = "";
                        let pages = jsonResponse.analyzeResult.pages as Page[];

                        for (let i = 0; i < pages.length; i++) {
                            let p = pages[i] as Page;
                            ocrObj += "Page " + p.pageNumber + "<br />";
                            ocrObj += "##############################<br />";
                            let lines = p.lines as Line[];

                            for (let i = 0; i < lines.length; i++) {
                                ocrObj += lines[i].content += "<br/>"
                            }
                            ocrObj += "##############################<br />";
                        }

                        let tables = jsonResponse.analyzeResult.tables as Table[];

                        for (let i = 0; i < tables.length; i++) {
                            ocrObj += "Table <br />";
                            ocrObj += "##############################<br />";

                            let cells = tables[i].cells as Cell[];
                            for (let i = 0; i < cells.length; i++) {
                                ocrObj += "(" + cells[i].rowIndex + "," + cells[i].columnIndex + "): " + cells[i].content + "<br/>";
                            }
                            ocrObj += "##############################<br />";
                        }

                        //temp
                        ocrObj += jsonResponse.analyzeResult.content;

                        setOcrResult(ocrObj);
                        
                    }
                    else {
                        let ocrLoad = ocrResultLoading
                        if (ocrLoad.endsWith("...")) {
                            ocrLoad.replace("...", "");
                        }

                        setOcrResultLoading(ocrLoad + ".");
                    }

                    resolve(null);
                    
                }, 33);
            });
        };

        if (file) {
            try {
               
                const fn = file.name;
                const urlPath = "http://localhost:5002/DemoOperations/start-ocr";
                const response = await fetch(urlPath, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
                    body: JSON.stringify(fn)
                });  

                const { sessionId } = await response.json();
                step1();
                const eventSource = new EventSource(`http://localhost:5002/DemoOperations/ocr/${sessionId}`);
        
                //alert('ok');
                eventSource.onmessage = function (event) {    
                    //alert(event);
                    //alert(event.data)

                    const dati = event.data.split("data: ")

                    for (const item of dati) {

                        updateOcr(item);
                    }
                    // Processa il nuovo token
                };

                eventSource.onerror = function (err) {
                    console.error("EventSource failed:", err);
                    eventSource.close();
                };


             

            } catch (error) {
                if (error instanceof Error) {
                    console.log('Error message:', error.message);
                } else {
                    console.log('Unexpected error:', error);
                }
            }          
        }
    }
  
    const sintetizza = async () => {

        openOthers();

        let s = "";

        const updateSintesi = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    s += newContent;

                    setOtherContent(s);
                    resolve(null);
                }, 33);
            });
        };

        let bb = "";

        if (showRealTime) {
            bb = JSON.stringify(transcription);
        }
        else if (showFileUpload) {
            bb = JSON.stringify(ocrResult);
        }

        const response = await fetch('http://localhost:5001/DemoOperations/start-summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: bb
        });

        const { sessionId } = await response.json();
        const eventSource = new EventSource(`http://localhost:5001/DemoOperations/summarize/${sessionId}`);

        eventSource.onmessage = function(event) {
            const newToken = event.data;
            updateSintesi(newToken);
            // Processa il nuovo token
        };

        eventSource.onerror = function(err) {
            console.error("EventSource failed:", err);
            eventSource.close();
        };


    }

    const translate = async () => {
        let s = "";
      
        const updateTranslation = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    s += newContent;

                    setOtherContent(s);
                    resolve(null);
                }, 33);
            });
        };

        const response = await fetch('http://localhost:5001/DemoOperations/start-translation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(otherContent)
        });

        const { sessionId } = await response.json();
        const eventSource = new EventSource(`http://localhost:5001/DemoOperations/translate/${sessionId}/${selectedLanguage}`);

      
        eventSource.onmessage = function(event) {
            const newToken = event.data;
            console.log(newToken);
            // Processa il nuovo token
        };

        eventSource.onmessage = function(event) {
            const newToken = event.data;
            updateTranslation(newToken);
            // Processa il nuovo token
        };

        eventSource.onerror = function(err) {
            console.error("EventSource failed:", err);
            eventSource.close();
        };

        //setTranslateInProgress(false);
    }

    const d1 = () => {
        setShowFileUpload(true);
        setShowHomePage(false);
    }

    const d2 = () => {
        setShowRealTime(true);
        setShowHomePage(false);
    }

    const listenQuestion = async () => {

        const speechConfig = SpeechConfig.fromSubscription("b80e5087c70e483aae9a708ddb5e5bb0", "SwitzerlandNorth");

        speechConfig.speechRecognitionLanguage = "IT-it";

        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        setRecognizer(recognizer);

        recognizer.recognizing = (s, e) => {
            setTranscription(e.result.text);           
        };

        recognizer.recognized = (s, e) => {
            if (e.result.reason === ResultReason.RecognizedSpeech) {
                setTranscription(e.result.text);               
            }
        };
        

        recognizer.startContinuousRecognitionAsync(
            () => {
                setTranscription('Continuous recognition started');
            },
            (error) => {
                setTranscription('Error starting continuous recognition: ' + error);
            });

    };

    const stopAudio = async () => {
        if (recognizer != null) {
            recognizer.stopContinuousRecognitionAsync();
        }
      
    }
    return (
        <>
            {showHomePage && (
                <div className="TileDiv">
                    <div className="Tile">
                        <h1>Demo 1</h1>
                        <div>Document jurney</div>
                        <button onClick={d1}>GO</button>
                    </div>
                    <div className="Tile">
                        <h1>Demo 2</h1>
                        <div>Real-time transcription</div>
                        <button onClick={d2}>GO</button>
                    </div>
                </div>
            )}

            {showRealTime && (
                <>
                    <h1> Real-time transcription: </h1>
                    <Button size="large" icon={<Mic48Filled primaryFill="#00428A" />} onClick={listenQuestion} />    
                    <Button size="large" icon={<MicPulseOff48Filled primaryFill="#00428A" />} onClick={stopAudio} /> 
                    <div className="divOCR">{transcription}</div><br />                 
                    <button onClick={openOthers}>Summarize and Translate</button>
                </>
            )}
            {showFileUpload && (
                
                 <div className="App">
                    <header className="App-header">
                        <h1>Upload a file</h1>
                        <input type="file" onChange={handleFileChange} /><br /><br />
                        <button onClick={ocr}>Start</button>

                    </header>
                </div>
            )}

            {showOCR && (
                                
                    <div>
                       
                        {ocrResult == "" && (
                            <>
                                 <div className="loading">
                                    <img src="loading_stp1.jpg" height="100%" width="100%" ></img>
                                </div><br/>
                                <h1> I'm working on the file {ocrResultLoading}</h1>
                            </>
                        )}
                        {ocrResult != "" && (
                            <>
                                <h1> OCR Result: </h1>
                                <div className="divOCR">{ocrResult}</div><br/>
                                <button onClick={openCopilot} disabled={ocrResult == null}>Your Own Copilot</button>
                                <button onClick={openOthers} disabled={ocrResult == null}>Summarize and Translate</button>
                            </>
                        )}                     
                      
                    </div>
               
            )}
            {showCopilot && (

                <div>
                    <h1>Your Own Copilot: </h1>
                    <div className="contentdivChat">
                        <Chat infocontext={ocrResult} icon="assistant.jpg" />
                    </div>
                    <br />                  
                    <button onClick={sintetizza} disabled={ocrResult == null}>Summarize and Translate</button>
                </div>
            )}

            {showOthers && (

                <div>
                    <h1>Summarize and Translate: </h1>

                    <select id="myDropdown" onChange={languageSelected} className="selectLanguage">
                        <option value="Inglese">Inglese</option>
                        <option value="Spagnolo">Spagnolo</option>
                        <option value="Francese">Francese</option>
                    </select>
                    <button onClick={translate} disabled={ocrResult == null}>Translate</button><br /><br />
                    <div className="divOther">{otherContent}</div><br />
                    {showFileUpload && (
                        <button onClick={openCopilot} disabled={ocrResult == null}>Your Own Copilot</button>
                    )}
                </div>
            )}

    </>
  )
}

export default App
