public class ragItem{
    public string role {get; set;}
    public string message {get; set;}
}

public class ragTerms{
    public string context {get; set;}
    public string[][] answers {get; set;}

    public string lastQuestion { get; set; }
}