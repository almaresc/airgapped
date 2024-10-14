import { useEffect, useState, ChangeEvent } from 'react'
import './App.css'
import Chat from './Chat/Chat'

//class OCR {
//    status: string;
//    analyzeResult: OCRResult;
//}

//class OCRResult {
//    content: string;
//    tables: Table[];
//    pages: Page[];
//}

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
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [showOCR, setShowOCR] = useState(true);
    const [showCopilot, setShowCopilot] = useState(false);
    const [showOthers, setShowOthers] = useState(false);
    const [ocrResult, setOcrResult] = useState("");
    const [ocrContent, setOcrContent] = useState("");
    //const [ocrInProgress, setOcrInProgress] = useState(false);
    const [summarizeInProgress, setSummarizeInProgress] = useState(false);
    const [translateInProgress, setTranslateInProgress] = useState(false);

    const [sintesi, setSintesi] = useState("");
    const [traduzione, setTraduzione] = useState("");
    //const [showSintesi, setShowSintesi] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);

    useEffect(() => { }, [summarizeInProgress]);
    useEffect(() => { }, [translateInProgress]);
    useEffect(() => { }, [ocrResult]);


    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
        //setShowDiv(true); // Mostra il div quando un file viene caricato
    };
    const openCopilot = () => {
        setShowOCR(false);
        setShowCopilot(true);
        setShowOthers(false);

    }
    const openOCR = () => {
        setShowOCR(true);
        setShowCopilot(false);
        setShowOthers(false);
    }
    const openOthers = () => {
        setShowOCR(false);
        setShowCopilot(false);
        setShowOthers(true);
    }

    
    const ocr = async () => {
        if (file) {
            try {
                let ocrObj = "Sto analizzando il file. Potrebbero volerci alcuni minuti."; 
                setOcrResult(ocrObj);
                setFileName(file.name);

                const fn = file.name;
                const urlPath = "http://localhost:5001/DemoOperations/ocr_test";
                const response = await fetch(urlPath, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
                    body: JSON.stringify(fn)
                });

                if (!response.ok) {
                    throw new Error(`Error! status: ${response.status}`);
                }

                const jsonResponse = await response.json();
                console.log('Result:', jsonResponse);

                ocrObj = "";
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

                setOcrResult("Full Content: "+jsonResponse.analyzeResult.content + "<br/>" +ocrObj);
                setOcrContent(jsonResponse.analyzeResult.content);

            } catch (error) {
                if (error instanceof Error) {
                    console.log('Error message:', error.message);
                } else {
                    console.log('Unexpected error:', error);
                }
            }
            //setOcrInProgress(false);
        }
    }
   
    const sintetizza = async () => {
        let s = "";

        const updateSintesi = (newContent: string) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        s += newContent;

                        setSintesi(s);;
                        resolve(null);
                    }, 33);
                });
        };

     
        setSummarizeInProgress(true);
            const response = await fetch('http://localhost:5001/DemoOperations/start-summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ocrContent)
            });

            const { sessionId } = await response.json();
            const eventSource = new EventSource(`http://localhost:5001/DemoOperations/summarize/${sessionId}`);

            setShowTranslation(false);
            //setShowSintesi(true);

            eventSource.onmessage = function (event) {
                const newToken = event.data;
                updateSintesi(newToken);
                // Processa il nuovo token
            };

            eventSource.onerror = function (err) {
                console.error("EventSource failed:", err);
                eventSource.close();
            };

            
        }   
   
    const translate = async () => {
        let s = "";
        setTranslateInProgress(true);

        const updateTranslation = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    s += newContent;

                    setTraduzione(s);;
                    resolve(null);
                }, 33);
            });
        };

        const response = await fetch('http://localhost:5001/DemoOperations/start-translation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sintesi)
        });

        const { sessionId } = await response.json();
        const eventSource = new EventSource(`http://localhost:5001/DemoOperations/translate/${sessionId}`);

        setShowTranslation(true);
        //setShowSintesi(false);
        eventSource.onmessage = function (event) {
            const newToken = event.data;
            console.log(newToken);
            // Processa il nuovo token
        };

        eventSource.onmessage = function (event) {
            const newToken = event.data;
            updateTranslation(newToken);
            // Processa il nuovo token
        };

        eventSource.onerror = function (err) {
            console.error("EventSource failed:", err);
            eventSource.close();
        };

        //setTranslateInProgress(false);
    }

    return (
    <>
        <div className="App">
            <header className="App-header">
               
                    {file != null && ocrResult != "" && (
                        <h3>Hai caricato il file {fileName}</h3>
                    )}

                    <div className="buttons">
                        <button onClick={openOCR}>OCR</button>
                        <button onClick={openCopilot} disabled={ocrResult == null}>Copilot</button>
                        <button onClick={openOthers} disabled={ocrResult == null}>Riassunto e Traduzione</button>
                    </div>

                    {showOCR && (
                      <>                    

                        <h3>Carica un file</h3>
                        <input type="file" onChange={handleFileChange} />
                            <button onClick={ocr}>Analizza</button>
                              <br /><br />
                              <div className="divOCR" dangerouslySetInnerHTML={{ __html: ocrResult }} />                           
                       </>
                  )}

                  {showCopilot && (

                      <>
                          <br /><br />
                          <div className="contentdivChat">
                                <Chat infocontext={ocrContent} icon="assistant.jpg" />
                          </div>
                      </>
                  )}

                  {showOthers && (

                      <>
                          <br /><br />
                          
                            <div className="buttons">
                                <button onClick={sintetizza}>Riassumi</button>
                           
                            </div>
                            <br /><br />
                            {summarizeInProgress && sintesi == null && (

                                <>
                                        <br /><br /><div className="divOther">Sto organizzando le attività di sintesi...</div>
                                </>
                            )}

                            {sintesi != "" && (
                                <>
                                    <div className="divOther">{sintesi}</div>  
                                    <br />

                                   
                                        <div className="buttons">
                                            <button onClick={translate}>Traduci in Inglese</button>
                                        </div>
                                   

                                    {translateInProgress && traduzione == null && (

                                        <><br /><br /><div className="divOther">Sto organizzando le attività di traduzione...</div></>
                                    )}

                                    {traduzione != "" && (
                                        <>
                                         <br /><br />                                

                                        {showTranslation && traduzione != "" && (
                                                    <div className="divOther">{traduzione}</div>
                                    
                                                )}
                                         </>
                                    )}
                                </>
                              )}
                          
                      </>
                  )}

            </header>
        </div>
    </>
  )
}

export default App
