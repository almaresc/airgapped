public class ocr{
    public ocr()
    {
        analyzeResult = new ocrResult();      
    }
    public string status {get; set;}
    public ocrResult analyzeResult {get; set;}
}

public class ocrResult{

    public ocrResult()
    {
        pages = new List<page>();
        tables = new List<table>();
    }
    public string content {get; set;}
    public List<table> tables { get; set; }

    public List<page> pages { get; set; }
}

public class page
{
    public int pageNumber { get; set; }
    public List<line> lines { get; set; }
}

public class line
{
    public string content { get; set; }
}
public class cell
{
    public string kind { get; set; }
    public int rowIndex { get; set; }
    public int columnIndex { get; set; }
    public string content { get; set; }
						
}

public class table
{
    public List<cell> cells { get; set; }

}