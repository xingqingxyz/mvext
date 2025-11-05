
using System.Management.Automation.Language;

namespace VisitAst;

public class TransformAction
{
  public static string ToDoubleQuoted(StringConstantExpressionAst ast) => ast.StringConstantType switch
  {
    StringConstantType.DoubleQuoted or StringConstantType.DoubleQuotedHereString => ast.ToString(),
    StringConstantType.SingleQuotedHereString => $"@\"\n{ast.Value}\n\"@",
    _ => $"\"{ast.Value}\""
  };

  public static string ExpandableToConcat(ExpandableStringExpressionAst ast)
  {
    List<string> items = [];
    var text = ast.Value;
    var start = ast.Extent.StartOffset;
    var index = 0;
    foreach (var expression in ast.NestedExpressions)
    {
      if (expression.Extent.StartOffset > start)
      {
        var s = text.Substring(index, expression.Extent.StartOffset - start).ReplaceLineEndings("\\n");
        items.Add($"\"{s}\"");
      }
      index += expression.Extent.EndOffset - start;
      start = expression.Extent.EndOffset;
      if (expression is SubExpressionAst sub && sub.SubExpression.Statements.Count == 1)
      {
        items.Add($"({sub.SubExpression})");
      }
      else
      {
        items.Add(expression.ToString());
      }
    }
    if (start < ast.Extent.EndOffset)
    {
      items.Add($"\"{text[index..].ReplaceLineEndings("\\n")}\"");
    }
    return string.Join(" + ", items);
  }

  public static string ConcatToExpandable(BinaryExpressionAst ast)
  {
    List<string> items = [];

    while (ast.Left is BinaryExpressionAst)
    {
      items.Add("");
    }
    return "";
  }
}

public class CodeActionProvider
{

}
