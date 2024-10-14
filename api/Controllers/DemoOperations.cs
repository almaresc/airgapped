using Microsoft.AspNetCore.Mvc;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using Azure.AI.OpenAI;
using System.Runtime.CompilerServices;
using Azure;
using Microsoft.ML.OnnxRuntimeGenAI;
using Microsoft.Extensions.Options;
using System.IO;
using System.Threading;
using System.Text;
using System.Reflection.Emit;

namespace api.Controllers;


[ApiController]
[Route("[controller]")]
public class DemoOperationsController : ControllerBase
{
    private readonly ILogger<WeatherForecastController> _logger;
    private readonly Tokenizer _tokenizer;
    private readonly Model _model;

    public DemoOperationsController(ILogger<WeatherForecastController> logger, Tokenizer tokenizer, Model model)
    {
        _logger = logger;
        _tokenizer = tokenizer;
        _model = model;
    }

    //public DemoOperationsController(ILogger<WeatherForecastController> logger)
    //{
    //    _logger = logger;
    //}

    [HttpPost("start-ocr")]
    public IActionResult StartGeneration([FromBody] string filePath)
    {
        var sessionId = Guid.NewGuid().ToString();
        System.IO.File.WriteAllText($"c:\\temp\\{sessionId}",filePath);

        return Ok(new { sessionId });
    }
       
   
    [HttpGet("ocr/{sessionId}")]
    public async Task Get(string sessionId, CancellationToken cancellationToken)
    {

        var filePath = System.IO.File.ReadAllText($"c:\\temp\\{sessionId}");
        using (var fileStream = new FileStream($"C:\\Data\\{filePath}", FileMode.Open, FileAccess.Read))
        {
            try
            {
                HttpResponseMessage response = null;
                // Crea un HttpClient
                using (HttpClient client = new HttpClient())
                {
                    // URL dell'endpoint
                    var url = $"http://localhost:5000/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31&pages=3,4,5";

                    // Crea il contenuto della richiesta
                    HttpContent content = new StreamContent(fileStream);
                    content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

                    // Effettua la chiamata POST
                    //response = await client.PostAsync(url, content);
                }

                var ocrobj = new ocr() { status = "starting" };

                Response.ContentType = "text/event-stream";

                await Response.WriteAsync($"data: {JsonConvert.SerializeObject(ocrobj)}");
                await Response.Body.FlushAsync();


                //if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
                //{
                    //var operationLocation = response.Headers.Where(m => m.Key == "Operation-Location").First().Value.First().ToString();

                    var output = "";
                 

                    ocrobj = new ocr() { status = "starting" };
                while (ocrobj.status != "succeeded" && ocrobj.status != "error")
                {
                    using (HttpClient client = new HttpClient())
                    {
                        Thread.Sleep(2000);
                        // Effettua la chiamata POST
                        //response = await client.GetAsync(operationLocation);

                        //if (response.StatusCode == System.Net.HttpStatusCode.OK)
                        //{
                        //    string responseBody = await response.Content.ReadAsStringAsync();

                        //    ocrobj = JsonConvert.DeserializeObject<ocr>(responseBody);

                        //    await Response.WriteAsync($"data: {JsonConvert.SerializeObject(ocrobj)}\n\n");
                        //    await Response.Body.FlushAsync();

                        //}
                        //else
                        //{
                        //    ocrobj.status = "error";
                        //    await Response.WriteAsync($"data: {JsonConvert.SerializeObject(ocrobj)}\n\n");
                        //    await Response.Body.FlushAsync();
                        //    break;
                        //}
                        ocrobj = new ocr() { status = "succeeded", analyzeResult = new ocrResult() { content = "bla bla" } };

                        await Response.WriteAsync($"data: {JsonConvert.SerializeObject(ocrobj)}\n\n");
                        await Response.Body.FlushAsync();
                    }

                    //}
                    //}
                    //else
                    //{
                    //    ocrobj = new ocr() { status = "error" };
                    //    await Response.WriteAsync($"data: {JsonConvert.SerializeObject(ocrobj)}\n\n");
                    //    await Response.Body.FlushAsync();
                    //}
                    // Leggi la risposta
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }

    //private async Task<ocr> WaitUntil(string operationLocation)
    //{
    //    var ocrobj = new ocr() { status = "starting" };
    //    while (ocrobj.status != "succeeded" && ocrobj.status != "error")
    //    {
    //        using (HttpClient client = new HttpClient())
    //        {
    //            Thread.Sleep(5000);                               
    //            // Effettua la chiamata POST
    //            HttpResponseMessage response = await client.GetAsync(operationLocation);

    //            if(response.StatusCode == System.Net.HttpStatusCode.OK)
    //            {
    //                string responseBody = await response.Content.ReadAsStringAsync();
    //                ocrobj = JsonConvert.DeserializeObject<ocr>(responseBody);                   
    //            }
    //            else 
    //            {
    //                ocrobj.status = "error";                   
    //            }               
                
    //        }

    //    }

    //    return ocrobj;


    //}
 
    [HttpGet("rag_v2/{sessionId}")]
    public async Task Generate_rag_response_v2(string sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var ragStr = System.IO.File.ReadAllText($"c:\\temp\\{sessionId}");

            var rag = JsonConvert.DeserializeObject<ragTerms>(ragStr);    

            var systemPrompt = @"You are an AI assistant that helps people find information. Answer questions based on the context below.
        if there are not enough information in the context below return 'non loso' e non aggiungere altro.
        Don't use your knowledge. Don't mention the context.
        IMPORTANT: Add always the string #END# when you finish to generate the answer.
        Context:
        #############################
        " + rag.context + @"        
        #############################
        ";

            var fullPrompt = $"<|system|>{systemPrompt}<|end|>";

            foreach (var i in rag.answers)
            {
                fullPrompt += $"<|user|>{i[0]}<|end|><|assistant|>{i[1]}<|end|>";
            }

            fullPrompt += $"<|user|>{rag.lastQuestion}<|end|><|assistant|>";

            var tokens = _tokenizer.Encode(fullPrompt);
            var generatorParams = new GeneratorParams(_model);
            generatorParams.SetSearchOption("max_length", 10048);
            generatorParams.SetSearchOption("past_present_share_buffer", false);
            generatorParams.SetInputSequences(tokens);
            var generator = new Generator(_model, generatorParams);

            Response.ContentType = "text/event-stream";

            var output = "";
            while (!generator.IsDone() && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    generator.ComputeLogits();
                    generator.GenerateNextToken();
                    var outputTokens = generator.GetSequence(0);
                    var newToken = outputTokens.Slice(outputTokens.Length - 1, 1);
                    output = _tokenizer.Decode(newToken);

                    await Response.WriteAsync($"data: {output}\n\n");
                    await Response.Body.FlushAsync();

                }
                catch (Exception ex)
                {
                    throw;
                }
            }

            //return guid;
        }
        catch(Exception ex) {
       
            throw;
        }
    }

    [HttpPost("start-generation")]
    public IActionResult StartGeneration([FromBody] ragTerms rag)
    {
        var sessionId = Guid.NewGuid().ToString();
        System.IO.File.WriteAllText($"c:\\temp\\{sessionId}", JsonConvert.SerializeObject(rag));

        return Ok(new { sessionId });
    }

    [HttpPost("start-summarize")]
    public IActionResult StartSummarization([FromBody] string content)
    {
        var sessionId = Guid.NewGuid().ToString();
        System.IO.File.WriteAllText($"c:\\temp\\{sessionId}", content);

        return Ok(new { sessionId });
    }

    [HttpPost("start-translation")]
    public IActionResult StartTranslation([FromBody] string content)
    {
        var sessionId = Guid.NewGuid().ToString();
        System.IO.File.WriteAllText($"c:\\temp\\{sessionId}", content);

        return Ok(new { sessionId });
    }

    [HttpGet("summarize/{sessionId}")]
    public async Task summarize(string sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var content = System.IO.File.ReadAllText($"c:\\temp\\{sessionId}");
            var systemPrompt = @"You are an AI assistant that helps people find execute a task. 
            Execute the task from the user.           
            ";

            var fullPrompt = $"<|system|>{systemPrompt}<|end|>";
                      
            fullPrompt += $"<|user|>Genera un riassunto del seguente testo:{content}<|end|><|assistant|>";

            var tokens = _tokenizer.Encode(fullPrompt);
            var generatorParams = new GeneratorParams(_model);
            generatorParams.SetSearchOption("max_length", 4096);
            generatorParams.SetSearchOption("past_present_share_buffer", false);
            generatorParams.SetInputSequences(tokens);
            var generator = new Generator(_model, generatorParams);

            var output = "";
            Response.ContentType = "text/event-stream";

            while (!generator.IsDone() && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    generator.ComputeLogits();
                    generator.GenerateNextToken();
                    var outputTokens = generator.GetSequence(0);
                    var newToken = outputTokens.Slice(outputTokens.Length - 1, 1);
                    output = _tokenizer.Decode(newToken);

                    await Response.WriteAsync($"data: {output}\n\n");
                    await Response.Body.FlushAsync();

                }
                catch (Exception ex)
                {
                    throw;
                }
            }
        }
        catch (Exception ex)
        {
            throw;
        }

    }

    [HttpGet("translate/{sessionId}/{language}")]
    public async Task translate(string sessionId, string language, CancellationToken cancellationToken)
    {
        try
        {
            var content = System.IO.File.ReadAllText($"c:\\temp\\{sessionId}");

            var systemPrompt = @"You are an AI assistant that helps people find execute a task. 
            Execute the task from the user.           
            ";

            var fullPrompt = $"<|system|>{systemPrompt}<|end|>";

            fullPrompt += $"<|user|>traduci il seguente testo in {language}:{content}<|end|><|assistant|>";

            var tokens = _tokenizer.Encode(fullPrompt);
            var generatorParams = new GeneratorParams(_model);
            generatorParams.SetSearchOption("max_length", 4096);
            generatorParams.SetSearchOption("past_present_share_buffer", false);
            generatorParams.SetInputSequences(tokens);
            var generator = new Generator(_model, generatorParams);

            var output = "";
            Response.ContentType = "text/event-stream";

 
            while (!generator.IsDone() && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    generator.ComputeLogits();
                    generator.GenerateNextToken();
                    var outputTokens = generator.GetSequence(0);
                    var newToken = outputTokens.Slice(outputTokens.Length - 1, 1);
                    output = _tokenizer.Decode(newToken);

                    await Response.WriteAsync($"data: {output}\n\n");
                    await Response.Body.FlushAsync();

                }
                catch (Exception ex)
                {
                    throw;
                }
            }
        }
        catch (Exception ex)
        {
            throw;
        }

    }

   
}