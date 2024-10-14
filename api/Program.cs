using Microsoft.ML.OnnxRuntimeGenAI;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var MyAllowSpecificOrigins = "AllowLocalhost";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod();
                      });
});





var modelPath = @"C:\Sources\models\Phi-3-mini-128k-instruct-onnx\cpu_and_mobile\cpu-int4-rtn-block-32-acc-level-4";

var model = new Model(modelPath);

var tokenizer = new Tokenizer(model);

builder.Services.AddSingleton<Tokenizer>(tokenizer);
builder.Services.AddSingleton<Model>(model);
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(MyAllowSpecificOrigins);

// Configure the HTTP request pipeline.

app.UseAuthorization();

app.MapControllers();

app.Run();
