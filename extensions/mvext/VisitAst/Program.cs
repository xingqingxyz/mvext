using System.Text.Json;
using VisitAst;

if (args.Length < 1)
{
  return;
}
var infile = args[0];
var tree = AstNodeVisitor.Visit(File.ReadAllText(infile));
if (args.Length > 1)
{
  var outfile = args[1];
  File.WriteAllText(outfile, JsonSerializer.Serialize(tree));
}
else
{
  Console.WriteLine(JsonSerializer.Serialize(tree));
}
